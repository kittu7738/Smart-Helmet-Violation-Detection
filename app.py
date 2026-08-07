import gradio as gr
from ultralytics import YOLO

model = YOLO("yolov8n.pt")

def detect(image):
    if image is None:
        return None

    results = model.predict(
        source=image,
        imgsz=640,
        conf=0.25,
        verbose=False
    )

    return results[0].plot()

with gr.Blocks(title="Smart Helmet Violation Detection System") as demo:

    gr.Markdown("# 🪖 Smart Helmet Violation Detection System")

    gr.Markdown("Upload an image for detection.")

    input_image = gr.Image(
        type="numpy",
        label="Upload Image"
    )

    detect_button = gr.Button("Detect")

    output_image = gr.Image(
        label="Detection Result"
    )

    detect_button.click(
        fn=detect,
        inputs=input_image,
        outputs=output_image
    )

demo.launch()