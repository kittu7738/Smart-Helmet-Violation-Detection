from ultralytics import YOLO

print("Loading model...")

model = YOLO("models/yolov8n.pt")

print("Model loaded!")

results = model.predict(
    source="datasets/test/test.jpg",
    conf=0.25,
    save=True
)

print("Detection completed!")