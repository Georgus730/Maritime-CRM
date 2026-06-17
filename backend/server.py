from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from pydantic_settings import BaseSettings
from typing import Optional, List
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt
from bson import ObjectId
from pymongo import MongoClient
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import os
from dotenv import load_dotenv
from enum import Enum

load_dotenv()

# Settings
class Settings(BaseSettings):
    mongo_url: str = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name: str = os.environ.get('DB_NAME', 'Maritime-CRM')
    jwt_secret: str = os.environ.get('JWT_SECRET', 'secret')
    jwt_algorithm: str = os.environ.get('JWT_ALGORITHM', 'HS256')
    jwt_expiration_hours: int = int(os.environ.get('JWT_EXPIRATION_HOURS', '24'))
    sendgrid_api_key: str = os.environ.get('SENDGRID_API_KEY', '')
    sender_email: str = os.environ.get('SENDER_EMAIL', '')

settings = Settings()

# Database
client = MongoClient(settings.mongo_url)
db = client[settings.db_name]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="MaritimeCRM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    HR = "hr"

class SailorStatus(str, Enum):
    AVAILABLE = "available"
    ON_VOYAGE = "on_voyage"
    NOT_AVAILABLE = "not_available"

class VacancyStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"
    AT_SEA = "at_sea"

class ContractStatus(str, Enum):
    PREPARATION = "preparation"
    FLIGHT = "flight"
    ON_BOARD = "on_board"
    COMPLETED = "completed"

class PipelineStage(str, Enum):
    CONTACT = "contact"
    INTERVIEW = "interview"
    OFFER = "offer"
    DOCUMENTS = "documents"
    JOINED = "joined"
    COMPLETED = "completed"

class VesselType(str, Enum):
    TANKER = "tanker"
    BULK_CARRIER = "bulk_carrier"
    CONTAINER = "container"
    PASSENGER = "passenger"
    GENERAL_CARGO = "general_cargo"

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.MANAGER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class Document(BaseModel):
    doc_type: str
    number: str
    issue_date: datetime
    expiry_date: datetime
    issuing_authority: Optional[str] = None

class SeaExperience(BaseModel):
    vessel_name: str
    vessel_type: VesselType
    flag: str
    company: str
    position: str
    start_date: datetime
    end_date: Optional[datetime] = None

class SailorCreate(BaseModel):
    full_name: str
    full_name_en: Optional[str] = None
    birth_date: datetime
    nationality: str
    phone: str
    email: EmailStr
    whatsapp: Optional[str] = None
    telegram: Optional[str] = None
    position: str
    status: SailorStatus = SailorStatus.AVAILABLE
    documents: List[Document] = []
    experience: List[SeaExperience] = []
    rating: int = Field(default=3, ge=1, le=5)
    english_level: Optional[str] = None
    notes: Optional[str] = None

class SailorUpdate(BaseModel):
    full_name: Optional[str] = None
    full_name_en: Optional[str] = None
    birth_date: Optional[datetime] = None
    nationality: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    whatsapp: Optional[str] = None
    telegram: Optional[str] = None
    position: Optional[str] = None
    status: Optional[SailorStatus] = None
    documents: Optional[List[Document]] = None
    experience: Optional[List[SeaExperience]] = None
    rating: Optional[int] = None
    english_level: Optional[str] = None
    notes: Optional[str] = None

class CompanyContact(BaseModel):
    name: str
    position: str
    email: EmailStr
    phone: Optional[str] = None

class SalaryScale(BaseModel):
    position: str
    min_salary: int
    max_salary: int
    currency: str = "USD"

class CompanyCreate(BaseModel):
    name: str
    flag: str
    country: str
    vessel_types: List[VesselType] = []
    contacts: List[CompanyContact] = []
    salary_scales: List[SalaryScale] = []
    notes: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    flag: Optional[str] = None
    country: Optional[str] = None
    vessel_types: Optional[List[VesselType]] = None
    contacts: Optional[List[CompanyContact]] = None
    salary_scales: Optional[List[SalaryScale]] = None
    notes: Optional[str] = None

class VacancyCreate(BaseModel):
    company_id: str
    position: str
    vessel_name: str
    vessel_type: VesselType
    requirements: List[str] = []
    min_experience_months: int = 0
    english_required: bool = False
    visa_required: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: str = "USD"
    start_date: Optional[datetime] = None
    contract_duration_months: int = 4
    status: VacancyStatus = VacancyStatus.OPEN
    notes: Optional[str] = None

class VacancyUpdate(BaseModel):
    company_id: Optional[str] = None
    position: Optional[str] = None
    vessel_name: Optional[str] = None
    vessel_type: Optional[VesselType] = None
    requirements: Optional[List[str]] = None
    min_experience_months: Optional[int] = None
    english_required: Optional[bool] = None
    visa_required: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: Optional[str] = None
    start_date: Optional[datetime] = None
    contract_duration_months: Optional[int] = None
    status: Optional[VacancyStatus] = None
    notes: Optional[str] = None

class ContractCreate(BaseModel):
    sailor_id: str
    vacancy_id: str
    sign_date: datetime
    start_date: datetime
    end_date: datetime
    status: ContractStatus = ContractStatus.PREPARATION
    salary: int
    currency: str = "USD"
    notes: Optional[str] = None

class ContractUpdate(BaseModel):
    sign_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[ContractStatus] = None
    salary: Optional[int] = None
    currency: Optional[str] = None
    notes: Optional[str] = None

class PipelineCandidate(BaseModel):
    sailor_id: str
    vacancy_id: str
    stage: PipelineStage = PipelineStage.CONTACT
    interview_link: Optional[str] = None
    notes: Optional[str] = None

class PipelineUpdate(BaseModel):
    stage: Optional[PipelineStage] = None
    interview_link: Optional[str] = None
    notes: Optional[str] = None

# Helper functions
def serialize_doc(doc: dict) -> dict:
    """Recursively serialize MongoDB document, converting ObjectId to str"""
    if doc is None:
        return None
    
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                result['id'] = str(value)
            else:
                result[key] = serialize_doc(value)
        return result
    elif isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    elif hasattr(doc, 'id'):  # Pydantic with id
        return doc
    else:
        # Handle ObjectId directly
        try:
            return str(doc)
        except:
            return doc

def serialize_docs(docs: list) -> list:
    return [serialize_doc(doc) for doc in docs if doc is not None]

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expiration_hours)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

security = HTTPBearer()

def get_current_user(token: str = Depends(security)) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token.credentials, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return serialize_doc(user)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def send_email_notification(to_email: str, subject: str, html_content: str):
    if not settings.sendgrid_api_key:
        print(f"SendGrid not configured. Email to {to_email}: {subject}")
        return False
    try:
        message = Mail(
            from_email=settings.sender_email,
            to_emails=to_email,
            subject=subject,
            html_content=html_content
        )
        sg = SendGridAPIClient(settings.sendgrid_api_key)
        response = sg.send(message)
        return response.status_code == 202
    except Exception as e:
        print(f"Email error: {e}")
        return False

# Auth endpoints
@app.post("/api/auth/register", response_model=TokenResponse)
async def register(user: UserCreate):
    if db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_dict = user.model_dump()
    user_dict["password"] = hash_password(user.password)
    user_dict["created_at"] = datetime.now(timezone.utc)
    result = db.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    if "_id" in user_dict:
        del user_dict["_id"]
    del user_dict["password"]
    token = create_access_token({"sub": user_dict["id"]})
    return TokenResponse(
        access_token=token,
        user=UserResponse(**user_dict)
    )

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user_data = serialize_doc(user)
    del user_data["password"]
    token = create_access_token({"sub": user_data["id"]})
    return TokenResponse(
        access_token=token,
        user=UserResponse(**user_data)
    )

@app.get("/api/auth/me")
async def get_me(current_user = Depends(get_current_user)):
    return current_user

# Users management (admin only)
@app.get("/api/users")
async def get_users(current_user = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    users = list(db.users.find({}, {"password": 0}))
    return serialize_docs(users)

@app.post("/api/users")
async def create_user(user: UserCreate, current_user = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    if db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_dict = user.model_dump()
    user_dict["password"] = hash_password(user.password)
    user_dict["created_at"] = datetime.now(timezone.utc)
    result = db.users.insert_one(user_dict)
    created_user = db.users.find_one({"_id": result.inserted_id}, {"password": 0})
    return serialize_doc(created_user)

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: str, current_user = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    result = db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

# Sailors endpoints
@app.get("/api/sailors")
async def get_sailors(
    status: Optional[SailorStatus] = None,
    position: Optional[str] = None,
    search: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status.value
    if position:
        query["position"] = {"$regex": position, "$options": "i"}
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    sailors = list(db.sailors.find(query))
    return serialize_docs(sailors)

@app.get("/api/sailors/{sailor_id}")
async def get_sailor(sailor_id: str, current_user = Depends(get_current_user)):
    sailor = db.sailors.find_one({"_id": ObjectId(sailor_id)})
    if not sailor:
        raise HTTPException(status_code=404, detail="Sailor not found")
    return serialize_doc(sailor)

@app.post("/api/sailors")
async def create_sailor(sailor: SailorCreate, current_user = Depends(get_current_user)):
    sailor_dict = sailor.model_dump()
    sailor_dict["created_at"] = datetime.now(timezone.utc)
    sailor_dict["documents"] = [d.model_dump() if hasattr(d, 'model_dump') else d for d in sailor_dict.get("documents", [])]
    sailor_dict["experience"] = [e.model_dump() if hasattr(e, 'model_dump') else e for e in sailor_dict.get("experience", [])]
    result = db.sailors.insert_one(sailor_dict)
    sailor_dict["id"] = str(result.inserted_id)
    return sailor_dict

@app.put("/api/sailors/{sailor_id}")
async def update_sailor(sailor_id: str, sailor: SailorUpdate, current_user = Depends(get_current_user)):
    update_data = {k: v for k, v in sailor.model_dump().items() if v is not None}
    if "documents" in update_data:
        update_data["documents"] = [d if isinstance(d, dict) else d.model_dump() for d in update_data["documents"]]
    if "experience" in update_data:
        update_data["experience"] = [e if isinstance(e, dict) else e.model_dump() for e in update_data["experience"]]
    update_data["updated_at"] = datetime.now(timezone.utc)
    result = db.sailors.update_one({"_id": ObjectId(sailor_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Sailor not found")
    return await get_sailor(sailor_id, current_user)

@app.delete("/api/sailors/{sailor_id}")
async def delete_sailor(sailor_id: str, current_user = Depends(get_current_user)):
    result = db.sailors.delete_one({"_id": ObjectId(sailor_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sailor not found")
    return {"message": "Sailor deleted"}

# Companies endpoints
@app.get("/api/companies")
async def get_companies(search: Optional[str] = None, current_user = Depends(get_current_user)):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"country": {"$regex": search, "$options": "i"}}
        ]
    companies = list(db.companies.find(query))
    return serialize_docs(companies)

@app.get("/api/companies/{company_id}")
async def get_company(company_id: str, current_user = Depends(get_current_user)):
    company = db.companies.find_one({"_id": ObjectId(company_id)})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return serialize_doc(company)

@app.post("/api/companies")
async def create_company(company: CompanyCreate, current_user = Depends(get_current_user)):
    company_dict = company.model_dump()
    company_dict["created_at"] = datetime.now(timezone.utc)
    company_dict["contacts"] = [c if isinstance(c, dict) else c.model_dump() for c in company_dict.get("contacts", [])]
    company_dict["salary_scales"] = [s if isinstance(s, dict) else s.model_dump() for s in company_dict.get("salary_scales", [])]
    result = db.companies.insert_one(company_dict)
    company_dict["id"] = str(result.inserted_id)
    return company_dict

@app.put("/api/companies/{company_id}")
async def update_company(company_id: str, company: CompanyUpdate, current_user = Depends(get_current_user)):
    update_data = {k: v for k, v in company.model_dump().items() if v is not None}
    if "contacts" in update_data:
        update_data["contacts"] = [c if isinstance(c, dict) else c.model_dump() for c in update_data["contacts"]]
    if "salary_scales" in update_data:
        update_data["salary_scales"] = [s if isinstance(s, dict) else s.model_dump() for s in update_data["salary_scales"]]
    update_data["updated_at"] = datetime.now(timezone.utc)
    result = db.companies.update_one({"_id": ObjectId(company_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
    return await get_company(company_id, current_user)

@app.delete("/api/companies/{company_id}")
async def delete_company(company_id: str, current_user = Depends(get_current_user)):
    result = db.companies.delete_one({"_id": ObjectId(company_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
    return {"message": "Company deleted"}

# Vacancies endpoints
@app.get("/api/vacancies")
async def get_vacancies(
    status: Optional[VacancyStatus] = None,
    company_id: Optional[str] = None,
    vessel_type: Optional[VesselType] = None,
    current_user = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status.value
    if company_id:
        query["company_id"] = company_id
    if vessel_type:
        query["vessel_type"] = vessel_type.value
    vacancies = list(db.vacancies.find(query))
    return serialize_docs(vacancies)

@app.get("/api/vacancies/{vacancy_id}")
async def get_vacancy(vacancy_id: str, current_user = Depends(get_current_user)):
    vacancy = db.vacancies.find_one({"_id": ObjectId(vacancy_id)})
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    return serialize_doc(vacancy)

@app.post("/api/vacancies")
async def create_vacancy(vacancy: VacancyCreate, current_user = Depends(get_current_user)):
    vacancy_dict = vacancy.model_dump()
    vacancy_dict["created_at"] = datetime.now(timezone.utc)
    result = db.vacancies.insert_one(vacancy_dict)
    vacancy_dict["id"] = str(result.inserted_id)
    return vacancy_dict

@app.put("/api/vacancies/{vacancy_id}")
async def update_vacancy(vacancy_id: str, vacancy: VacancyUpdate, current_user = Depends(get_current_user)):
    update_data = {k: v for k, v in vacancy.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    result = db.vacancies.update_one({"_id": ObjectId(vacancy_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    return await get_vacancy(vacancy_id, current_user)

@app.delete("/api/vacancies/{vacancy_id}")
async def delete_vacancy(vacancy_id: str, current_user = Depends(get_current_user)):
    result = db.vacancies.delete_one({"_id": ObjectId(vacancy_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    return {"message": "Vacancy deleted"}

# Contracts endpoints
@app.get("/api/contracts")
async def get_contracts(
    status: Optional[ContractStatus] = None,
    sailor_id: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status.value
    if sailor_id:
        query["sailor_id"] = sailor_id
    contracts = list(db.contracts.find(query))
    return serialize_docs(contracts)

@app.get("/api/contracts/{contract_id}")
async def get_contract(contract_id: str, current_user = Depends(get_current_user)):
    contract = db.contracts.find_one({"_id": ObjectId(contract_id)})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return serialize_doc(contract)

@app.post("/api/contracts")
async def create_contract(contract: ContractCreate, current_user = Depends(get_current_user)):
    contract_dict = contract.model_dump()
    contract_dict["created_at"] = datetime.now(timezone.utc)
    result = db.contracts.insert_one(contract_dict)
    contract_dict["id"] = str(result.inserted_id)
    return contract_dict

@app.put("/api/contracts/{contract_id}")
async def update_contract(contract_id: str, contract: ContractUpdate, current_user = Depends(get_current_user)):
    update_data = {k: v for k, v in contract.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    result = db.contracts.update_one({"_id": ObjectId(contract_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contract not found")
    return await get_contract(contract_id, current_user)

@app.delete("/api/contracts/{contract_id}")
async def delete_contract(contract_id: str, current_user = Depends(get_current_user)):
    result = db.contracts.delete_one({"_id": ObjectId(contract_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contract not found")
    return {"message": "Contract deleted"}

# Pipeline endpoints
@app.get("/api/pipeline")
async def get_pipeline(
    vacancy_id: Optional[str] = None,
    stage: Optional[PipelineStage] = None,
    current_user = Depends(get_current_user)
):
    query = {}
    if vacancy_id:
        query["vacancy_id"] = vacancy_id
    if stage:
        query["stage"] = stage.value
    candidates = list(db.pipeline.find(query))
    return serialize_docs(candidates)

@app.post("/api/pipeline")
async def add_to_pipeline(candidate: PipelineCandidate, current_user = Depends(get_current_user)):
    candidate_dict = candidate.model_dump()
    candidate_dict["created_at"] = datetime.now(timezone.utc)
    result = db.pipeline.insert_one(candidate_dict)
    candidate_dict["id"] = str(result.inserted_id)
    return serialize_doc(candidate_dict)

@app.put("/api/pipeline/{pipeline_id}")
async def update_pipeline(pipeline_id: str, update: PipelineUpdate, current_user = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    result = db.pipeline.update_one({"_id": ObjectId(pipeline_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pipeline entry not found")
    entry = db.pipeline.find_one({"_id": ObjectId(pipeline_id)})
    return serialize_doc(entry)

@app.delete("/api/pipeline/{pipeline_id}")
async def remove_from_pipeline(pipeline_id: str, current_user = Depends(get_current_user)):
    result = db.pipeline.delete_one({"_id": ObjectId(pipeline_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pipeline entry not found")
    return {"message": "Removed from pipeline"}

# Smart matching
@app.get("/api/matching/{vacancy_id}")
async def find_candidates(vacancy_id: str, authorization: Optional[str] = None):
    get_current_user(authorization)
    vacancy = db.vacancies.find_one({"_id": ObjectId(vacancy_id)})
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    
    query = {
        "status": SailorStatus.AVAILABLE.value,
        "position": {"$regex": vacancy.get("position", ""), "$options": "i"}
    }
    
    vessel_type = vacancy.get("vessel_type")
    if vessel_type:
        query["experience.vessel_type"] = vessel_type
    
    sailors = list(db.sailors.find(query).sort("rating", -1).limit(20))
    return serialize_docs(sailors)

# Dashboard stats
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user = Depends(get_current_user)):
    
    total_sailors = db.sailors.count_documents({})
    available_sailors = db.sailors.count_documents({"status": SailorStatus.AVAILABLE.value})
    open_vacancies = db.vacancies.count_documents({"status": VacancyStatus.OPEN.value})
    active_contracts = db.contracts.count_documents({"status": {"$in": [ContractStatus.ON_BOARD.value, ContractStatus.PREPARATION.value]}})
    total_companies = db.companies.count_documents({})
    
    return {
        "total_sailors": total_sailors,
        "available_sailors": available_sailors,
        "open_vacancies": open_vacancies,
        "active_contracts": active_contracts,
        "total_companies": total_companies
    }

@app.get("/api/dashboard/expiring-documents")
async def get_expiring_documents(current_user = Depends(get_current_user)):
    
    three_months_from_now = datetime.now(timezone.utc) + timedelta(days=90)
    
    sailors = list(db.sailors.find({}))
    expiring = []
    
    for sailor in sailors:
        sailor_data = serialize_doc(sailor)
        for doc in sailor_data.get("documents", []):
            expiry = doc.get("expiry_date")
            if expiry:
                if isinstance(expiry, str):
                    expiry = datetime.fromisoformat(expiry.replace("Z", "+00:00"))
                if expiry <= three_months_from_now:
                    expiring.append({
                        "sailor_id": sailor_data["id"],
                        "sailor_name": sailor_data["full_name"],
                        "document_type": doc["doc_type"],
                        "expiry_date": expiry.isoformat() if hasattr(expiry, 'isoformat') else str(expiry),
                        "days_remaining": (expiry - datetime.now(timezone.utc)).days if hasattr(expiry, '__sub__') else 0
                    })
    
    return sorted(expiring, key=lambda x: x.get("days_remaining", 999))

@app.get("/api/dashboard/upcoming-rotations")
async def get_upcoming_rotations(authorization: Optional[str] = None):
    get_current_user(authorization)
    
    one_month_from_now = datetime.now(timezone.utc) + timedelta(days=30)
    
    contracts = list(db.contracts.find({
        "status": ContractStatus.ON_BOARD.value,
        "end_date": {"$lte": one_month_from_now}
    }))
    
    rotations = []
    for contract in contracts:
        contract_data = serialize_doc(contract)
        sailor = db.sailors.find_one({"_id": ObjectId(contract_data["sailor_id"])})
        vacancy = db.vacancies.find_one({"_id": ObjectId(contract_data["vacancy_id"])})
        
        rotations.append({
            "contract_id": contract_data["id"],
            "sailor_name": sailor["full_name"] if sailor else "Unknown",
            "vessel_name": vacancy["vessel_name"] if vacancy else "Unknown",
            "end_date": contract_data["end_date"].isoformat() if hasattr(contract_data["end_date"], 'isoformat') else str(contract_data["end_date"])
        })
    
    return rotations

@app.get("/api/dashboard/recent-sailors")
async def get_recent_sailors(limit: int = 5, authorization: Optional[str] = None):
    get_current_user(authorization)
    sailors = list(db.sailors.find().sort("created_at", -1).limit(limit))
    return serialize_docs(sailors)

# Send document expiry notifications
@app.post("/api/notifications/expiring-documents")
async def send_expiry_notifications(background_tasks: BackgroundTasks, authorization: Optional[str] = None):
    get_current_user(authorization)
    
    expiring = await get_expiring_documents(authorization)
    sent_count = 0
    
    for doc in expiring:
        sailor = db.sailors.find_one({"_id": ObjectId(doc["sailor_id"])})
        if sailor and sailor.get("email"):
            subject = f"Document Expiry Alert: {doc['document_type']}"
            html = f"""
            <h2>Document Expiry Notification</h2>
            <p>Dear {sailor['full_name']},</p>
            <p>Your <strong>{doc['document_type']}</strong> will expire on <strong>{doc['expiry_date']}</strong>.</p>
            <p>Days remaining: <strong>{doc['days_remaining']}</strong></p>
            <p>Please renew your document as soon as possible.</p>
            <p>Best regards,<br>MaritimeCRM Team</p>
            """
            background_tasks.add_task(send_email_notification, sailor["email"], subject, html)
            sent_count += 1
    
    return {"message": f"Queued {sent_count} notification emails"}

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "maritimecrm-api"}

# Seed demo data
@app.post("/api/seed")
async def seed_demo_data():
    # Clear existing data
    db.users.delete_many({})
    db.sailors.delete_many({})
    db.companies.delete_many({})
    db.vacancies.delete_many({})
    db.contracts.delete_many({})
    db.pipeline.delete_many({})
    
    # Create admin user
    admin = {
        "email": "admin@crewcrm.com",
        "password": hash_password("admin123"),
        "full_name": "System Administrator",
        "role": "admin",
        "created_at": datetime.now(timezone.utc)
    }
    db.users.insert_one(admin)
    
    # Create manager user
    manager = {
        "email": "manager@crewcrm.com",
        "password": hash_password("manager123"),
        "full_name": "Ivan Petrov",
        "role": "manager",
        "created_at": datetime.now(timezone.utc)
    }
    db.users.insert_one(manager)
    
    # Create companies
    companies = [
        {
            "name": "Maersk Line",
            "flag": "Denmark",
            "country": "Denmark",
            "vessel_types": ["container", "tanker"],
            "contacts": [{"name": "Hans Jensen", "position": "HR Manager", "email": "hans@maersk.com", "phone": "+45 123 456"}],
            "salary_scales": [{"position": "Captain", "min_salary": 8000, "max_salary": 12000, "currency": "USD"}],
            "created_at": datetime.now(timezone.utc)
        },
        {
            "name": "MSC",
            "flag": "Switzerland",
            "country": "Switzerland",
            "vessel_types": ["container", "passenger"],
            "contacts": [{"name": "Maria Rossi", "position": "Recruitment", "email": "maria@msc.com", "phone": "+41 789 012"}],
            "salary_scales": [{"position": "Chief Engineer", "min_salary": 7000, "max_salary": 11000, "currency": "USD"}],
            "created_at": datetime.now(timezone.utc)
        },
        {
            "name": "Sovcomflot",
            "flag": "Russia",
            "country": "Russia",
            "vessel_types": ["tanker", "bulk_carrier"],
            "contacts": [{"name": "Alexey Ivanov", "position": "HR Director", "email": "alexey@scf.ru", "phone": "+7 495 123 4567"}],
            "salary_scales": [{"position": "3rd Engineer", "min_salary": 3500, "max_salary": 5000, "currency": "USD"}],
            "created_at": datetime.now(timezone.utc)
        },
        {
            "name": "Carnival Corporation",
            "flag": "USA",
            "country": "USA",
            "vessel_types": ["passenger"],
            "contacts": [{"name": "John Smith", "position": "Fleet Manager", "email": "john@carnival.com", "phone": "+1 305 555 0123"}],
            "salary_scales": [{"position": "Captain", "min_salary": 10000, "max_salary": 15000, "currency": "USD"}],
            "created_at": datetime.now(timezone.utc)
        }
    ]
    company_ids = db.companies.insert_many(companies).inserted_ids
    
    # Create sailors
    now = datetime.now(timezone.utc)
    sailors = [
        {
            "full_name": "Сергей Николаевич Морозов",
            "full_name_en": "Sergey Morozov",
            "birth_date": datetime(1985, 3, 15, tzinfo=timezone.utc),
            "nationality": "Russia",
            "phone": "+7 921 123 4567",
            "email": "morozov@mail.ru",
            "whatsapp": "+7 921 123 4567",
            "telegram": "@morozov_sea",
            "position": "Captain",
            "status": "available",
            "rating": 5,
            "english_level": "Fluent",
            "documents": [
                {"doc_type": "Seaman's Passport", "number": "SP123456", "issue_date": now - timedelta(days=365*2), "expiry_date": now + timedelta(days=30)},
                {"doc_type": "STCW", "number": "STCW789", "issue_date": now - timedelta(days=365), "expiry_date": now + timedelta(days=365*2)},
                {"doc_type": "International Passport", "number": "IP456789", "issue_date": now - timedelta(days=365*3), "expiry_date": now + timedelta(days=60)}
            ],
            "experience": [
                {"vessel_name": "MSC Oscar", "vessel_type": "container", "flag": "Panama", "company": "MSC", "position": "Captain", "start_date": now - timedelta(days=365), "end_date": now - timedelta(days=30)}
            ],
            "notes": "Excellent leadership skills",
            "created_at": now
        },
        {
            "full_name": "Александр Викторович Волков",
            "full_name_en": "Alexander Volkov",
            "birth_date": datetime(1990, 7, 22, tzinfo=timezone.utc),
            "nationality": "Russia",
            "phone": "+7 911 234 5678",
            "email": "volkov@gmail.com",
            "whatsapp": "+7 911 234 5678",
            "position": "Chief Engineer",
            "status": "available",
            "rating": 4,
            "english_level": "Good",
            "documents": [
                {"doc_type": "Seaman's Passport", "number": "SP234567", "issue_date": now - timedelta(days=365), "expiry_date": now + timedelta(days=365)},
                {"doc_type": "STCW", "number": "STCW456", "issue_date": now - timedelta(days=180), "expiry_date": now + timedelta(days=365*4)}
            ],
            "experience": [
                {"vessel_name": "Maersk Alabama", "vessel_type": "container", "flag": "USA", "company": "Maersk", "position": "Chief Engineer", "start_date": now - timedelta(days=200), "end_date": now - timedelta(days=50)}
            ],
            "created_at": now - timedelta(days=5)
        },
        {
            "full_name": "Дмитрий Павлович Соколов",
            "full_name_en": "Dmitry Sokolov",
            "birth_date": datetime(1988, 11, 5, tzinfo=timezone.utc),
            "nationality": "Russia",
            "phone": "+7 931 345 6789",
            "email": "sokolov@yandex.ru",
            "telegram": "@sokolov_engineer",
            "position": "3rd Engineer",
            "status": "on_voyage",
            "rating": 4,
            "english_level": "Intermediate",
            "documents": [
                {"doc_type": "Seaman's Passport", "number": "SP345678", "issue_date": now - timedelta(days=500), "expiry_date": now + timedelta(days=200)},
                {"doc_type": "STCW", "number": "STCW123", "issue_date": now - timedelta(days=300), "expiry_date": now + timedelta(days=80)}
            ],
            "experience": [
                {"vessel_name": "SCF Ural", "vessel_type": "tanker", "flag": "Russia", "company": "Sovcomflot", "position": "3rd Engineer", "start_date": now - timedelta(days=90), "end_date": None}
            ],
            "created_at": now - timedelta(days=10)
        },
        {
            "full_name": "Иван Сергеевич Козлов",
            "full_name_en": "Ivan Kozlov",
            "birth_date": datetime(1992, 4, 18, tzinfo=timezone.utc),
            "nationality": "Russia",
            "phone": "+7 951 456 7890",
            "email": "kozlov@mail.ru",
            "position": "2nd Officer",
            "status": "available",
            "rating": 3,
            "english_level": "Good",
            "documents": [
                {"doc_type": "Seaman's Passport", "number": "SP456789", "issue_date": now - timedelta(days=400), "expiry_date": now + timedelta(days=15)},
                {"doc_type": "GMDSS", "number": "GMDSS001", "issue_date": now - timedelta(days=200), "expiry_date": now + timedelta(days=365*2)}
            ],
            "experience": [
                {"vessel_name": "Carnival Dream", "vessel_type": "passenger", "flag": "Panama", "company": "Carnival", "position": "2nd Officer", "start_date": now - timedelta(days=300), "end_date": now - timedelta(days=120)}
            ],
            "created_at": now - timedelta(days=3)
        },
        {
            "full_name": "Михаил Андреевич Новиков",
            "full_name_en": "Mikhail Novikov",
            "birth_date": datetime(1995, 9, 30, tzinfo=timezone.utc),
            "nationality": "Russia",
            "phone": "+7 961 567 8901",
            "email": "novikov@gmail.com",
            "whatsapp": "+7 961 567 8901",
            "position": "Able Seaman",
            "status": "available",
            "rating": 4,
            "english_level": "Basic",
            "documents": [
                {"doc_type": "Seaman's Passport", "number": "SP567890", "issue_date": now - timedelta(days=250), "expiry_date": now + timedelta(days=365)},
                {"doc_type": "Basic Safety Training", "number": "BST789", "issue_date": now - timedelta(days=100), "expiry_date": now + timedelta(days=365*4)}
            ],
            "experience": [
                {"vessel_name": "Baltic Carrier", "vessel_type": "bulk_carrier", "flag": "Liberia", "company": "Baltic Shipping", "position": "Able Seaman", "start_date": now - timedelta(days=180), "end_date": now - timedelta(days=60)}
            ],
            "created_at": now - timedelta(days=1)
        },
        {
            "full_name": "Петр Олегович Федоров",
            "full_name_en": "Petr Fedorov",
            "birth_date": datetime(1983, 1, 12, tzinfo=timezone.utc),
            "nationality": "Russia",
            "phone": "+7 981 678 9012",
            "email": "fedorov@yandex.ru",
            "position": "Chief Officer",
            "status": "not_available",
            "rating": 5,
            "english_level": "Fluent",
            "documents": [
                {"doc_type": "Seaman's Passport", "number": "SP678901", "issue_date": now - timedelta(days=600), "expiry_date": now + timedelta(days=400)},
                {"doc_type": "STCW", "number": "STCW999", "issue_date": now - timedelta(days=400), "expiry_date": now + timedelta(days=365*3)}
            ],
            "experience": [
                {"vessel_name": "Ever Given", "vessel_type": "container", "flag": "Panama", "company": "Evergreen", "position": "Chief Officer", "start_date": now - timedelta(days=500), "end_date": now - timedelta(days=200)}
            ],
            "created_at": now - timedelta(days=15)
        },
        {
            "full_name": "Андрей Юрьевич Смирнов",
            "full_name_en": "Andrey Smirnov",
            "birth_date": datetime(1991, 6, 8, tzinfo=timezone.utc),
            "nationality": "Ukraine",
            "phone": "+380 50 123 4567",
            "email": "smirnov@ukr.net",
            "position": "Electrician",
            "status": "available",
            "rating": 4,
            "english_level": "Intermediate",
            "documents": [
                {"doc_type": "Seaman's Passport", "number": "SP789012", "issue_date": now - timedelta(days=300), "expiry_date": now + timedelta(days=45)},
                {"doc_type": "Electrical Certificate", "number": "EC456", "issue_date": now - timedelta(days=150), "expiry_date": now + timedelta(days=365*2)}
            ],
            "experience": [
                {"vessel_name": "Nordic Tanker", "vessel_type": "tanker", "flag": "Norway", "company": "Nordic Shipping", "position": "Electrician", "start_date": now - timedelta(days=250), "end_date": now - timedelta(days=100)}
            ],
            "created_at": now - timedelta(days=7)
        },
        {
            "full_name": "Виктор Геннадьевич Попов",
            "full_name_en": "Viktor Popov",
            "birth_date": datetime(1987, 12, 25, tzinfo=timezone.utc),
            "nationality": "Russia",
            "phone": "+7 991 789 0123",
            "email": "popov@mail.ru",
            "position": "2nd Engineer",
            "status": "available",
            "rating": 4,
            "english_level": "Good",
            "documents": [
                {"doc_type": "Seaman's Passport", "number": "SP890123", "issue_date": now - timedelta(days=450), "expiry_date": now + timedelta(days=180)},
                {"doc_type": "STCW", "number": "STCW555", "issue_date": now - timedelta(days=350), "expiry_date": now + timedelta(days=365*2)}
            ],
            "experience": [
                {"vessel_name": "SCF Baikal", "vessel_type": "tanker", "flag": "Russia", "company": "Sovcomflot", "position": "2nd Engineer", "start_date": now - timedelta(days=400), "end_date": now - timedelta(days=180)}
            ],
            "created_at": now - timedelta(days=12)
        }
    ]
    sailor_ids = db.sailors.insert_many(sailors).inserted_ids
    
    # Create vacancies
    vacancies = [
        {
            "company_id": str(company_ids[0]),
            "position": "Captain",
            "vessel_name": "Maersk Emerald",
            "vessel_type": "container",
            "requirements": ["STCW", "5+ years experience", "Container ship experience"],
            "min_experience_months": 60,
            "english_required": True,
            "salary_min": 9000,
            "salary_max": 12000,
            "currency": "USD",
            "start_date": now + timedelta(days=30),
            "contract_duration_months": 4,
            "status": "open",
            "created_at": now
        },
        {
            "company_id": str(company_ids[2]),
            "position": "3rd Engineer",
            "vessel_name": "SCF Amur",
            "vessel_type": "tanker",
            "requirements": ["STCW", "Tanker experience", "COC valid"],
            "min_experience_months": 24,
            "english_required": False,
            "salary_min": 3500,
            "salary_max": 4500,
            "currency": "USD",
            "start_date": now + timedelta(days=14),
            "contract_duration_months": 4,
            "status": "open",
            "created_at": now - timedelta(days=2)
        },
        {
            "company_id": str(company_ids[1]),
            "position": "Chief Engineer",
            "vessel_name": "MSC Fantasia",
            "vessel_type": "passenger",
            "requirements": ["STCW", "Passenger ship experience", "Management experience"],
            "min_experience_months": 48,
            "english_required": True,
            "salary_min": 8000,
            "salary_max": 11000,
            "currency": "USD",
            "start_date": now + timedelta(days=45),
            "contract_duration_months": 6,
            "status": "in_progress",
            "created_at": now - timedelta(days=5)
        },
        {
            "company_id": str(company_ids[3]),
            "position": "2nd Officer",
            "vessel_name": "Carnival Breeze",
            "vessel_type": "passenger",
            "requirements": ["STCW", "GMDSS", "Passenger ship experience preferred"],
            "min_experience_months": 18,
            "english_required": True,
            "salary_min": 4000,
            "salary_max": 5500,
            "currency": "USD",
            "start_date": now + timedelta(days=21),
            "contract_duration_months": 4,
            "status": "open",
            "created_at": now - timedelta(days=1)
        },
        {
            "company_id": str(company_ids[0]),
            "position": "Able Seaman",
            "vessel_name": "Maersk Ruby",
            "vessel_type": "container",
            "requirements": ["Basic Safety Training", "Valid seaman's passport"],
            "min_experience_months": 12,
            "english_required": False,
            "salary_min": 1800,
            "salary_max": 2200,
            "currency": "USD",
            "start_date": now + timedelta(days=10),
            "contract_duration_months": 4,
            "status": "open",
            "created_at": now
        },
        {
            "company_id": str(company_ids[2]),
            "position": "2nd Engineer",
            "vessel_name": "SCF Neva",
            "vessel_type": "tanker",
            "requirements": ["STCW", "Tanker endorsement", "COC Class II"],
            "min_experience_months": 36,
            "english_required": False,
            "salary_min": 5000,
            "salary_max": 6500,
            "currency": "USD",
            "start_date": now + timedelta(days=60),
            "contract_duration_months": 4,
            "status": "open",
            "created_at": now - timedelta(days=3)
        },
        {
            "company_id": str(company_ids[1]),
            "position": "Electrician",
            "vessel_name": "MSC Meraviglia",
            "vessel_type": "passenger",
            "requirements": ["Electrical Certificate", "HV experience"],
            "min_experience_months": 24,
            "english_required": True,
            "salary_min": 3000,
            "salary_max": 4000,
            "currency": "USD",
            "start_date": now + timedelta(days=35),
            "contract_duration_months": 5,
            "status": "open",
            "created_at": now - timedelta(days=4)
        },
        {
            "company_id": str(company_ids[0]),
            "position": "Chief Officer",
            "vessel_name": "Maersk Diamond",
            "vessel_type": "container",
            "requirements": ["STCW", "COC Class I", "Container experience"],
            "min_experience_months": 36,
            "english_required": True,
            "salary_min": 6000,
            "salary_max": 8000,
            "currency": "USD",
            "start_date": now + timedelta(days=25),
            "contract_duration_months": 4,
            "status": "closed",
            "created_at": now - timedelta(days=20)
        }
    ]
    vacancy_ids = db.vacancies.insert_many(vacancies).inserted_ids
    
    # Create some contracts
    contracts = [
        {
            "sailor_id": str(sailor_ids[2]),
            "vacancy_id": str(vacancy_ids[1]),
            "sign_date": now - timedelta(days=100),
            "start_date": now - timedelta(days=90),
            "end_date": now + timedelta(days=20),
            "status": "on_board",
            "salary": 4000,
            "currency": "USD",
            "created_at": now - timedelta(days=100)
        }
    ]
    db.contracts.insert_many(contracts)
    
    # Create pipeline entries
    pipeline = [
        {
            "sailor_id": str(sailor_ids[0]),
            "vacancy_id": str(vacancy_ids[0]),
            "stage": "interview",
            "interview_link": "https://meet.google.com/abc-defg-hij",
            "notes": "Scheduled for tomorrow",
            "created_at": now - timedelta(days=1)
        },
        {
            "sailor_id": str(sailor_ids[1]),
            "vacancy_id": str(vacancy_ids[2]),
            "stage": "offer",
            "notes": "Awaiting response",
            "created_at": now - timedelta(days=3)
        },
        {
            "sailor_id": str(sailor_ids[3]),
            "vacancy_id": str(vacancy_ids[3]),
            "stage": "contact",
            "notes": "First contact made",
            "created_at": now
        }
    ]
    db.pipeline.insert_many(pipeline)
    
    return {
        "message": "Demo data seeded successfully",
        "data": {
            "users": 2,
            "sailors": len(sailors),
            "companies": len(companies),
            "vacancies": len(vacancies),
            "contracts": len(contracts),
            "pipeline": len(pipeline)
        },
        "credentials": {
            "admin": {"email": "admin@maritimecrm.com", "password": "admin123"},
            "manager": {"email": "manager@maritimecrm.com", "password": "manager123"}
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

