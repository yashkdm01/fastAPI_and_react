# backend/app/api/routes.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.data_processing import load_csv_to_dataframe, DATASETS
from app.services.ai_service import process_query
from pydantic import BaseModel

# creating router for our endpoints
router = APIRouter()

# defining how the incoming query data should look
class QueryRequest(BaseModel):
    question: str
    dataset_id: str

# route to handle file uploads
@router.post("/api/v1/upload")
async def upload_dataset(file: UploadFile = File(...)):
    # passing file to our service and getting back id and dataframe
    dataset_id, df = await load_csv_to_dataframe(file)
    
    # extracting column names to send back
    column_data = df.columns.tolist()
    
    # converting row count to standard python int so json doesnt crash
    row_count = int(df.shape[0])
    
    # returning success and some basic info about the dataset
    return {
        "status": "success", 
        "dataset_id": dataset_id,
        "metadata": {"rows": row_count, "columns": column_data}
    }

# route to handle asking questions to ai
@router.post("/api/v1/query")
async def query_dataset(request: QueryRequest):
    # finding the dataset from memory using the id
    df = DATASETS.get(request.dataset_id)
    
    # checking if dataset actually exists
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found or session expired.")
    
    # passing data and question to ai service
    result = await process_query(df, request.question)
    
    # returning the final insight and chart data
    return result