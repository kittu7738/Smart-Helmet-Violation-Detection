import gradio as gr
from ultralytics import YOLO

model = YOLO("models/yolov8n.pt")

def detect(image):
    if image is None:
        return None

    results = model.predict(
        source=image,
        conf=0.25
    )

    return results[0].plot()

with gr.Blocks(title="Smart Helmet Violation Detection") as demo:

    gr.Markdown("# 🪖 Smart Helmet Violation Detection System")

    gr.Markdown("Upload an image to test the AI model.")

    input_image = gr.Image(type="numpy", label="Upload Image")

    output_image = gr.Image(label="Detection Result")

    detect_button = gr.Button("Detect Objects")

    detect_button.click(
        fn=detect,
        inputs=input_image,
        outputs=output_image
    )

demo.launch(
    server_name="127.0.0.1",
    server_port=7860,
    share=True
)