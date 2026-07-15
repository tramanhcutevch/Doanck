import uvicorn
import onnxruntime as ort
import numpy as np
import io
from fastapi import FastAPI, File, UploadFile, HTTPException
from PIL import Image

# Khởi tạo FastAPI
app = FastAPI(title="Tomato Disease API")

# 1. LOAD MODEL
# Đảm bảo file model.onnx nằm cùng thư mục với file app.py này
try:
    session = ort.InferenceSession("model.onnx")
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    session = None

# Danh sách nhãn (Phải đúng thứ tự training)
class_names = [
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
    "Tomato___powdery_mildew"
]

# 2. HÀM TIỀN XỬ LÝ ẢNH (Logic cũ của bạn)
def preprocess_image(image: Image.Image):
    # Resize về 32x32
    image = image.resize((32, 32))
    
    # Convert sang RGB
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Normalize và chuyển dimension
    img_array = np.array(image).astype(np.float32) / 255.0
    img_array = (img_array - 0.5) / 0.5
    img_array = img_array.transpose(2, 0, 1)
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array

@app.get("/")
def read_root():
    return {"status": "Tomato API is running correctly. Use POST /predict to classify."}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if session is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        # Đọc ảnh từ n8n gửi lên
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Tiền xử lý
        input_data = preprocess_image(image)
        
        # Chạy dự đoán (Inference)
        input_name = session.get_inputs()[0].name
        outputs = session.run(None, {input_name: input_data})
        
        # Xử lý kết quả (Softmax)
        logits = outputs[0][0]
        exp_logits = np.exp(logits - np.max(logits))
        probs = exp_logits / np.sum(exp_logits)
        
        # Tìm class có xác suất cao nhất (Top 1)
        pred_idx = np.argmax(probs)
        top_label = class_names[pred_idx]
        confidence = float(probs[pred_idx])
        
        # Trả về JSON gọn gàng cho n8n
        return {
            "prediction": top_label,
            "confidence": round(confidence, 4),
            "all_scores": {class_names[i]: float(probs[i]) for i in range(len(class_names))}
        }

    except Exception as e:
        return {"error": str(e)}

# Chạy server trên cổng 7860
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)