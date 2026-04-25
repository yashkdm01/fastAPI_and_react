import pandas as pd
from fastapi import UploadFile, HTTPException
import io
import uuid

# storing uploaded datasets in memory for now
DATASETS = {}

async def load_csv_to_dataframe(file: UploadFile) -> tuple[str, pd.DataFrame]:
    # checking if the uploaded file is actually a csv
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")
    
    # reading the raw data from the file
    file_bytes = await file.read()
    
    try:
        # converting bytes into a pandas dataframe safely in memory
        df = pd.read_csv(io.BytesIO(file_bytes))
        
        # cleaning up column names so ai doesnt get confused later (Audit Passed)
        df.columns = df.columns.str.strip().str.lower().str.replace(r'[\s\-]+', '_', regex=True)
        
        # generating a random id for this specific dataset
        dataset_id = str(uuid.uuid4())
        
        # saving dataframe to our memory dictionary
        DATASETS[dataset_id] = df
        
        # returning the id and the dataframe
        return dataset_id, df
    except Exception as e:
        # throwing an error if pandas fails to read the data
        raise HTTPException(status_code=500, detail=f"DataFrame construction failed: {str(e)}")