"""
python-service/detection_store.py
==================================
Central in-memory detection store with persistent JSON storage.
Serves as the single backend source of truth for:
  - Real Co-DETR detection records
  - Reports (/api/violations)
  - Analytics (/api/metrics and /api/violations/analytics)
"""

import os
import json
import time
import threading
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

# File path for persistent detection records
_SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
_REPO_ROOT = os.path.abspath(os.path.join(_SERVICE_DIR, ".."))
STORE_FILE = os.environ.get(
    "DETECTION_STORE_FILE",
    os.path.join(_REPO_ROOT, "work_dirs", "detection_records.json")
)


class DetectionStore:
    def __init__(self, store_path: str = STORE_FILE):
        self.store_path = store_path
        self._lock = threading.Lock()
        self._records: List[Dict[str, Any]] = []
        self._load_from_disk()

    def _load_from_disk(self):
        """Loads existing records from disk if available."""
        if os.path.isfile(self.store_path) and os.path.getsize(self.store_path) > 0:
            try:
                with open(self.store_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        self._records = data
                        print(f"[{time.strftime('%H:%M:%S')}] [DetectionStore] Loaded {len(self._records)} real detection records from {self.store_path}")
            except Exception as e:
                print(f"[WARN] [DetectionStore] Failed to load {self.store_path}: {e}")
                self._records = []
        elif not os.path.isfile(self.store_path):
            self._records = []

    def _save_to_disk(self):
        """Persists records to disk atomically."""
        try:
            os.makedirs(os.path.dirname(os.path.abspath(self.store_path)), exist_ok=True)
            temp_path = self.store_path + ".tmp"
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(self._records, f, indent=2)
            os.replace(temp_path, self.store_path)
        except Exception as e:
            print(f"[WARN] [DetectionStore] Failed to save {self.store_path}: {e}")

    def add_prediction(
        self,
        prediction_res: Any,
        filename: str,
        processed_image: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Accepts a CoDETRPredictor result (ImagePredictionResponse or dict)
        and normalizes it into a central detection record.
        Includes deduplication guard to prevent duplicate writes for the same inference.
        """
        with self._lock:
            # Handle Pydantic model or dict
            if hasattr(prediction_res, "dict"):
                res_dict = prediction_res.dict()
            elif isinstance(prediction_res, dict):
                res_dict = prediction_res
            else:
                res_dict = json.loads(json.dumps(prediction_res, default=str))

            detections_raw = res_dict.get("detections", [])
            summary_raw = res_dict.get("summary", {})
            inf_time = res_dict.get("inference_time_ms", 0.0)

            # Classify detections accurately
            norm_detections = []
            motorcycles = 0
            drivers = 0
            passengers = 0
            with_helmet = 0
            without_helmet = 0
            driver_violations = 0
            passenger_violations = 0

            for det in detections_raw:
                cname = det.get("class_name", "")
                conf = float(det.get("confidence", 0.0))
                bbox = det.get("bbox", [0, 0, 0, 0])
                violation = bool(det.get("violation", False))

                # Exact violation definition: ONLY driver_without_helmet or passenger_without_helmet
                is_driver_violation = (cname == "driver_without_helmet")
                is_passenger_violation = (cname == "passenger_without_helmet")
                is_violation = is_driver_violation or is_passenger_violation

                if cname == "bike":
                    motorcycles += 1
                elif "driver" in cname:
                    drivers += 1
                    if "with_helmet" in cname:
                        with_helmet += 1
                    elif "without_helmet" in cname:
                        without_helmet += 1
                        driver_violations += 1
                elif "passenger" in cname:
                    passengers += 1
                    if "with_helmet" in cname:
                        with_helmet += 1
                    elif "without_helmet" in cname:
                        without_helmet += 1
                        passenger_violations += 1

                norm_detections.append({
                    "className": cname,
                    "displayName": det.get("display_name", cname),
                    "confidence": round(conf, 4),
                    "bbox": bbox,
                    "violation": is_violation,
                })

            total_violations = driver_violations + passenger_violations
            rounded_inf_time = round(float(inf_time), 1)

            # Deduplication guard: check if the most recent record matches this exact inference
            if self._records:
                latest = self._records[0]
                if (latest.get("fileName") == filename and
                    abs(latest.get("inferenceTimeMs", 0.0) - rounded_inf_time) < 0.2 and
                    len(latest.get("detections", [])) == len(norm_detections)):
                    print(f"[{time.strftime('%H:%M:%S')}] [DetectionStore] Idempotent deduplication: skipping duplicate record for {filename}")
                    return latest

            record_id = f"det-{int(time.time() * 1000)}-{os.urandom(2).hex()}"
            # Accurate UTC ISO-8601 timestamp with Z suffix
            iso_now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

            record = {
                "id": record_id,
                "timestamp": iso_now,
                "fileName": filename or "Unknown",
                "processedImage": processed_image or res_dict.get("processedImage"),
                "detections": norm_detections,
                "rawDetections": norm_detections,
                "summary": {
                    "motorcycles": motorcycles,
                    "drivers": drivers,
                    "passengers": passengers,
                    "withHelmet": with_helmet,
                    "withoutHelmet": without_helmet,
                    "violations": total_violations,
                    "driverViolations": driver_violations,
                    "passengerViolations": passenger_violations,
                },
                "inferenceTimeMs": rounded_inf_time,
                "status": "VIOLATION DETECTED" if total_violations > 0 else "NO VIOLATION",
            }

            self._records.insert(0, record)  # Newest first
            if len(self._records) > 1000:
                self._records = self._records[:1000]

            self._save_to_disk()
            print(f"[{time.strftime('%H:%M:%S')}] [DetectionStore] Recorded inference: {record_id} ({filename}) - {total_violations} violations")
            return record

    def add_custom_record(self, record_data: Dict[str, Any]) -> Dict[str, Any]:
        """Allows direct insertion of an already normalized record with deduplication."""
        with self._lock:
            rec_id = record_data.get("id")
            if rec_id and any(r.get("id") == rec_id for r in self._records):
                return record_data

            if self._records:
                latest = self._records[0]
                if (latest.get("fileName") == record_data.get("fileName") and
                    latest.get("inferenceTimeMs") == record_data.get("inferenceTimeMs") and
                    len(latest.get("detections", [])) == len(record_data.get("detections", []))):
                    return latest

            if not rec_id:
                record_data["id"] = f"det-{int(time.time() * 1000)}"
            if "timestamp" not in record_data:
                record_data["timestamp"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

            self._records.insert(0, record_data)
            if len(self._records) > 1000:
                self._records = self._records[:1000]
            self._save_to_disk()
            return record_data

    def get_records(self) -> List[Dict[str, Any]]:
        with self._lock:
            return list(self._records)

    def get_latest_record(self) -> Optional[Dict[str, Any]]:
        """Returns the single most recent detection record, or None if store is empty."""
        with self._lock:
            if self._records:
                return dict(self._records[0])
            return None

    def get_violations(
        self,
        search: Optional[str] = None,
        rider_type: Optional[str] = None,
        status: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Derives violation rows for Reports page.
        A violation is created ONLY when a real detection contains:
          - driver_without_helmet (riderType: DRIVER)
          - passenger_without_helmet (riderType: PASSENGER)
        """
        with self._lock:
            violation_rows = []

            for rec in self._records:
                ts_str = rec.get("timestamp", "")
                time_display = "Unknown"
                if ts_str:
                    try:
                        dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                        time_display = dt.strftime("%H:%M:%S")
                    except Exception:
                        time_display = ts_str[:8]

                file_name = rec.get("fileName", "Unknown")

                for idx, det in enumerate(rec.get("detections", [])):
                    cname = det.get("className", "")
                    if cname not in ("driver_without_helmet", "passenger_without_helmet"):
                        continue

                    is_driver = (cname == "driver_without_helmet")
                    r_type = "DRIVER" if is_driver else "PASSENGER"
                    v_label = "Driver Without Helmet" if is_driver else "Passenger Without Helmet"
                    conf_pct = round(float(det.get("confidence", 0.0)) * 100, 1)

                    row = {
                        "id": f"{rec['id']}-v{idx}",
                        "time": time_display,
                        "vehicle": file_name,  # Actual image source, no fake license plates
                        "violation": v_label,
                        "confidence": conf_pct,
                        "status": "VIOLATION DETECTED",
                        "riderType": r_type,
                        "location": "Unknown",
                        "timestamp": ts_str,
                    }
                    violation_rows.append(row)

            # Filtering
            filtered = violation_rows
            if search:
                q = search.lower()
                filtered = [
                    r for r in filtered
                    if q in r["vehicle"].lower()
                    or q in r["violation"].lower()
                    or q in r["location"].lower()
                ]

            if rider_type and rider_type != "ALL":
                filtered = [r for r in filtered if r["riderType"] == rider_type]

            if status and status != "ALL":
                filtered = [r for r in filtered if r["status"] == status]

            if limit:
                filtered = filtered[:limit]

            return filtered

    def get_metrics(self) -> Dict[str, Any]:
        """
        Computes real aggregated metrics for Analytics page from all stored detection records.
        """
        with self._lock:
            total_records = len(self._records)
            if total_records == 0:
                return {
                    "totalDetections": 0,
                    "totalMotorcycles": 0,
                    "totalDrivers": 0,
                    "totalPassengers": 0,
                    "withHelmet": 0,
                    "withoutHelmet": 0,
                    "totalViolations": 0,
                    "driverViolations": 0,
                    "passengerViolations": 0,
                    "helmetCompliancePercentage": 0.0,
                    "violationRate": 0.0,
                    "averageConfidence": 0.0,
                    "averageInferenceTime": 0.0,
                    "detectionsOverTime": [],
                    "violationsOverTime": [],
                    "riderComparison": {
                        "driverViolations": 0,
                        "passengerViolations": 0,
                        "driverPercent": 0.0,
                        "passengerPercent": 0.0,
                    },
                    "totalRecords": 0,
                }

            total_detections = 0
            total_motorcycles = 0
            total_drivers = 0
            total_passengers = 0
            with_helmet = 0
            without_helmet = 0
            total_violations = 0
            driver_violations = 0
            passenger_violations = 0
            confidences = []
            inference_times = []

            # Group violations by hour
            hourly_violations: Dict[str, Dict[str, int]] = {}
            timeline_detections: List[Dict[str, Any]] = []

            for rec in reversed(self._records):  # Chronological order
                s = rec.get("summary", {})
                total_motorcycles += s.get("motorcycles", 0)
                total_drivers += s.get("drivers", 0)
                total_passengers += s.get("passengers", 0)
                with_helmet += s.get("withHelmet", 0)
                without_helmet += s.get("withoutHelmet", 0)
                total_violations += s.get("violations", 0)
                driver_violations += s.get("driverViolations", 0)
                passenger_violations += s.get("passengerViolations", 0)

                inf_t = rec.get("inferenceTimeMs")
                if inf_t is not None:
                    inference_times.append(float(inf_t))

                dets = rec.get("detections", [])
                total_detections += len(dets)
                for d in dets:
                    conf = d.get("confidence")
                    if conf is not None:
                        confidences.append(float(conf))

                ts_str = rec.get("timestamp", "")
                if ts_str:
                    try:
                        dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                        hour_key = dt.strftime("%H:00")
                        min_key = dt.strftime("%H:%M")
                    except Exception:
                        hour_key = "Unknown"
                        min_key = "Unknown"
                else:
                    hour_key = "Unknown"
                    min_key = "Unknown"

                if hour_key not in hourly_violations:
                    hourly_violations[hour_key] = {"violations": 0, "compliant": 0}
                hourly_violations[hour_key]["violations"] += s.get("violations", 0)
                hourly_violations[hour_key]["compliant"] += s.get("withHelmet", 0)

                timeline_detections.append({
                    "time": min_key,
                    "detections": len(dets),
                    "violations": s.get("violations", 0),
                })

            total_riders = with_helmet + without_helmet
            compliance_pct = round((with_helmet / total_riders) * 100, 1) if total_riders > 0 else 0.0
            violation_rate = round((without_helmet / total_riders) * 100, 1) if total_riders > 0 else 0.0
            avg_conf = round(sum(confidences) / len(confidences) * 100, 1) if confidences else 0.0
            avg_inf = round(sum(inference_times) / len(inference_times), 1) if inference_times else 0.0

            # Rider comparison percentages
            rider_total_viol = driver_violations + passenger_violations
            driver_pct = round((driver_violations / rider_total_viol) * 100, 1) if rider_total_viol > 0 else 0.0
            pass_pct = round((passenger_violations / rider_total_viol) * 100, 1) if rider_total_viol > 0 else 0.0

            # Build violationsOverTime array
            violations_over_time = [
                {"hour": h, "violations": counts["violations"], "compliant": counts["compliant"]}
                for h, counts in sorted(hourly_violations.items())
            ]

            return {
                "totalDetections": total_detections,
                "totalMotorcycles": total_motorcycles,
                "totalDrivers": total_drivers,
                "totalPassengers": total_passengers,
                "withHelmet": with_helmet,
                "withoutHelmet": without_helmet,
                "totalViolations": total_violations,
                "driverViolations": driver_violations,
                "passengerViolations": passenger_violations,
                "helmetCompliancePercentage": compliance_pct,
                "violationRate": violation_rate,
                "averageConfidence": avg_conf,
                "averageInferenceTime": avg_inf,
                "detectionsOverTime": timeline_detections[-20:],
                "violationsOverTime": violations_over_time,
                "riderComparison": {
                    "driverViolations": driver_violations,
                    "passengerViolations": passenger_violations,
                    "driverPercent": driver_pct,
                    "passengerPercent": pass_pct,
                },
                "totalRecords": total_records,
            }

    def clear(self):
        """Clears all records (used for test setup)."""
        with self._lock:
            self._records = []
            self._save_to_disk()


# Singleton instance
global_detection_store = DetectionStore()
