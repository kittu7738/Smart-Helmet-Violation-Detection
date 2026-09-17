import json
import os
import argparse
from collections import defaultdict
import itertools

def compute_iou(box1, box2):
    x1, y1, w1, h1 = box1
    x2, y2, w2, h2 = box2
    
    # Calculate intersection coordinates
    ix1 = max(x1, x2)
    iy1 = max(y1, y2)
    ix2 = min(x1 + w1, x2 + w2)
    iy2 = min(y1 + h1, y2 + h2)
    
    iw = max(0, ix2 - ix1)
    ih = max(0, iy2 - iy1)
    
    if iw == 0 or ih == 0:
        return 0.0
        
    intersection = iw * ih
    union = (w1 * h1) + (w2 * h2) - intersection
    return intersection / union if union > 0 else 0.0

def audit_split(json_path, split_name):
    if not os.path.exists(json_path):
        print(f"[!] Warning: {json_path} not found.")
        return

    with open(json_path, 'r') as f:
        data = json.load(f)

    images = {img['id']: img for img in data.get('images', [])}
    categories = {cat['id']: cat['name'] for cat in data.get('categories', [])}
    
    cat_counts = defaultdict(int)
    img_has_cat = defaultdict(set)
    box_widths = defaultdict(list)
    box_heights = defaultdict(list)
    box_areas = defaultdict(list)
    
    issues = []
    
    seen_img_ids = set()
    for img in data.get('images', []):
        if img['id'] in seen_img_ids:
            issues.append({'issue': 'Duplicate image ID', 'id': img['id']})
        seen_img_ids.add(img['id'])

    seen_ann_ids = set()
    img_to_anns = defaultdict(list)

    for ann in data.get('annotations', []):
        ann_id = ann['id']
        if ann_id in seen_ann_ids:
            issues.append({'issue': 'Duplicate annotation ID', 'id': ann_id})
        seen_ann_ids.add(ann_id)
        
        cat_id = ann['category_id']
        img_id = ann['image_id']
        
        if img_id not in images:
            issues.append({'issue': 'Missing image reference', 'ann_id': ann_id, 'img_id': img_id})
            continue
            
        cat_name = categories.get(cat_id, f"Unknown-{cat_id}")
        
        cat_counts[cat_name] += 1
        img_has_cat[cat_name].add(img_id)
        
        bbox = ann.get('bbox', [0, 0, 0, 0])
        x, y, w, h = bbox
        area = w * h
        box_widths[cat_name].append(w)
        box_heights[cat_name].append(h)
        box_areas[cat_name].append(area)

        # Store for overlap check
        img_to_anns[img_id].append({'id': ann_id, 'cat_name': cat_name, 'bbox': bbox})

        # Check for zero/negative width/height
        if w <= 0 or h <= 0:
            issues.append({'image_id': img_id, 'ann_id': ann_id, 'issue': 'Zero or negative box width/height', 'bbox': bbox})
        
        # Check if outside image
        img = images[img_id]
        if x < 0 or y < 0 or (x + w) > img.get('width', float('inf')) or (y + h) > img.get('height', float('inf')):
            issues.append({'image_id': img_id, 'ann_id': ann_id, 'issue': 'Box out of image bounds', 'bbox': bbox})

    # Taxonomy Ambiguity / Overlap Check
    ambiguous_overlaps = 0
    for img_id, anns in img_to_anns.items():
        # Compare all pairs of annotations in the same image
        for a1, a2 in itertools.combinations(anns, 2):
            iou = compute_iou(a1['bbox'], a2['bbox'])
            if iou > 0.90:  # Highly overlapping
                if a1['cat_name'] != a2['cat_name']:
                    ambiguous_overlaps += 1
                    issues.append({
                        'image_id': img_id, 
                        'issue': f"Taxonomy Ambiguity (IoU={iou:.2f})", 
                        'desc': f"Box {a1['id']} ({a1['cat_name']}) overlaps Box {a2['id']} ({a2['cat_name']})"
                    })

    print(f"\n==================================================")
    print(f" AUDIT: {split_name} ({len(images)} images, {len(data.get('annotations', []))} annotations)")
    print(f"==================================================")
    print("Class Distribution (Instances):")
    for cat_name, count in sorted(cat_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  - {cat_name}: {count} (in {len(img_has_cat[cat_name])} unique images)")
        
    print("\nBounding Box Statistics:")
    for cat_name in sorted(box_areas.keys()):
        areas = box_areas[cat_name]
        widths = box_widths[cat_name]
        heights = box_heights[cat_name]
        avg_area = sum(areas) / len(areas) if areas else 0
        avg_w = sum(widths) / len(widths) if widths else 0
        avg_h = sum(heights) / len(heights) if heights else 0
        print(f"  - {cat_name}: Avg Area {avg_area:.1f} px^2 | Avg WxH {avg_w:.1f}x{avg_h:.1f}")

    if ambiguous_overlaps > 0:
        print(f"\n[TAXONOMY WARNING] Found {ambiguous_overlaps} instances of highly overlapping bounding boxes with DIFFERENT classes (e.g. driver vs driver_with_helmet). This severely degrades detector training!")

    if issues:
        print(f"\n[WARNING] Found {len(issues)} problematic annotations/metadata issues!")
        for issue in issues[:15]: # Print top 15
            desc = issue.get('desc', '')
            bbox_str = f" (Box: {issue['bbox']})" if 'bbox' in issue else ''
            print(f"  -> Img {issue.get('image_id', 'N/A')}: {issue['issue']} {desc}{bbox_str}")
        if len(issues) > 15:
            print(f"  ... and {len(issues) - 15} more.")
    else:
        print("\n[OK] No zero/negative/out-of-bounds/duplicate bounding boxes detected.")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data-root', default='/content/dataset_local')
    args = parser.parse_args()
    
    print(f"Auditing Dataset at: {args.data_root}")
    
    # Corrected dataset paths as per user specification
    audit_split(os.path.join(args.data_root, 'instances_train.json'), 'TRAIN')
    audit_split(os.path.join(args.data_root, 'instances_val.json'), 'VALIDATION')
    audit_split(os.path.join(args.data_root, 'instances_test.json'), 'TEST')

if __name__ == '__main__':
    main()
