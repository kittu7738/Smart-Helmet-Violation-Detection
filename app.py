import gradio as gr
from ultralytics import YOLOv10

model = YOLOv10("models/yolov10n.pt")

def detect_image(image):
    if image is None:
        return None

    results = model.predict(
        source=image,
        imgsz=640,
        conf=0.25
    )

    return results[0].plot()

def detect_webcam(image):
    if image is None:
        return None

    results = model.predict(
        source=image,
        imgsz=640,
        conf=0.25
    )

    return results[0].plot()

with gr.Blocks(title="Smart Helmet Violation Detection System") as demo:

    gr.Markdown("# 🪖 Smart Helmet Violation Detection System")
    gr.Markdown("### YOLOv10 Object Detection")

    with gr.Tab("Upload Image"):

        input_image = gr.Image(
            type="numpy",
            label="Upload Image"
        )

        output_image = gr.Image(
            label="Detection Result"
        )

        image_button = gr.Button("Detect")

        image_button.click(
            fn=detect_image,
            inputs=input_image,
            outputs=output_image
        )

    with gr.Tab("Webcam"):

        webcam = gr.Image(
            sources=["webcam"],
            type="numpy",
            label="Webcam"
        )

        webcam_output = gr.Image(
            label="Detection Result"
        )

        webcam_button = gr.Button("Detect")

        webcam_button.click(
            fn=detect_webcam,
            inputs=webcam,
            outputs=webcam_output
        )

demo.launch()