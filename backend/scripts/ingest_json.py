import os
import json
import chromadb
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
CHROMA_PATH = os.path.join("backend", "chroma_db")
JSON_PATH = 'C:/Users/91949/PycharmProjects/chatbotfinal/chatbot-poc/backend/data/knowledge_base.json'
COLLECTION_NAME = "default"

def flatten_list(l):
    return ", ".join(l) if isinstance(l, list) else str(l)

def create_chunks(data):
    chunks = []

    # 1. College Info
    college = data.get("college", {})
    contact = college.get("contact", {})
    chunks.append({
        "title": "College Information",
        "category": "General",
        "content": f"Name: {college.get('name')}\nTagline: {college.get('tagline')}\nAffiliation: {college.get('affiliation')}\nWebsite: {college.get('website')}\nAddress: {contact.get('address')}\nPhones: {flatten_list(contact.get('phones'))}\nEmail: {contact.get('email')}"
    })

    # 2. About
    about = data.get("about", {})
    chunks.append({
        "title": "About Vimala College",
        "category": "General",
        "content": f"Description: {about.get('description')}\nVision: {about.get('vision')}\nManagement: {about.get('management')}\nGender Policy: {about.get('gender_policy')}"
    })

    # 3. Principal
    principal = data.get("principal", {})
    chunks.append({
        "title": "Principal Details",
        "category": "Administration",
        "content": f"Name: {principal.get('name')}\nTitle: {principal.get('title')}\nQualifications: {principal.get('qualifications')}\nAwards: {flatten_list(principal.get('awards'))}"
    })

    # 4. Rankings
    rankings = data.get("rankings_and_accreditations", {})
    nirf = "\n".join([f"Year {r['year']}: Rank {r['rank']}" for r in rankings.get("NIRF", []) if r['rank']])
    kirf = "\n".join([f"Year {r['year']}: Rank {r['rank']}" for r in rankings.get("KIRF", []) if r['rank']])
    chunks.append({
        "title": "Rankings and Accreditations",
        "category": "General",
        "content": f"NIRF Rankings:\n{nirf}\n\nKIRF Rankings:\n{kirf}\n\nISO: {rankings.get('ISO')}\nDBT Star College: {rankings.get('DBT_STAR_College')}\nAutonomous Status Year: {rankings.get('Autonomous_Status', {}).get('year')}"
    })

    # 5. Programmes / Faculties
    progs = data.get("programmes", {})
    facs = progs.get("faculties", {})
    fac_text = "\n".join([f"{k}: {flatten_list(v)}" for k, v in facs.items() if v])
    chunks.append({
        "title": "Academic Faculties",
        "category": "Academics",
        "content": f"The college offers programs under several faculties:\n{fac_text}"
    })

    # 6. Course Lists (Exhaustive)
    ug = progs.get("UG_courses", {})
    pg = progs.get("PG_courses", {})
    phd = progs.get("PhD_programmes", [])
    
    chunks.append({
        "title": "Available Courses (Aided & Self-Financing)",
        "category": "Academics",
        "content": (
            "### Aided Courses\n"
            "**UG Courses (Aided):**\n" + "\n".join(ug.get("aided", [])) + "\n\n"
            "**PG Courses (Aided):**\n" + "\n".join(pg.get("aided", [])) + "\n\n"
            "### Self-Financing Courses\n"
            "**UG Courses (Self-Finance):**\n" + "\n".join(ug.get("self_finance", [])) + "\n\n"
            "**PG Courses (Self-Finance):**\n" + "\n".join(pg.get("self_finance", []))
        )
    })

    chunks.append({
        "title": "PhD Programmes",
        "category": "Academics",
        "content": "PhD programs are available in the following subjects:\n" + "\n".join(phd)
    })

    # 7. Admission Process
    adm = data.get("admission", {})
    chunks.append({
        "title": "Admission Process and Links",
        "category": "Admission",
        "content": f"Year: {adm.get('year')}\nApplication Links:\nFYUG & PG: {adm.get('apply_links', {}).get('FYUG_and_PG')}\nMSW: {adm.get('apply_links', {}).get('MSW')}\nNote: {adm.get('note')}\nHelpdesk: Phones: {flatten_list(adm.get('helpdesk', {}).get('phones'))}, Email: {adm.get('helpdesk', {}).get('email')}"
    })

    # 8. UG Eligibility (Individual)
    for elig in adm.get("course_eligibility", []):
        chunks.append({
            "title": f"Eligibility for {elig['course']}",
            "category": "Eligibility",
            "content": f"Course: {elig['course']}\nEligibility: {elig['eligibility']}\nIndex Mark: {elig['index_mark']}\nTie Break: {elig['tie_break']}"
        })

    # 9. PG Eligibility (Individual)
    pg_details = data.get("pg_courses_details", {})
    for cat in pg_details.get("categories", []):
        for course in cat.get("courses", []):
            note_text = f"\nNote: {course.get('additional_note')}" if course.get('additional_note') else ""
            chunks.append({
                "title": f"Eligibility for {course['name']}",
                "category": "Eligibility",
                "content": f"Course: {course['name']} ({cat['category']})\nEligibility: {course['eligibility']}{note_text}"
            })

    # 10. Events
    for event in data.get("events", []):
        chunks.append({
            "title": f"Event: {event['title']}",
            "category": "Events",
            "content": f"Title: {event['title']}\nDate: {event['date']}\nDepartment: {event['department']}\nDescription: {event['description']}\nLink: {event['url']}"
        })

    # 11. Featured News
    for news in data.get("featured_news", []):
        chunks.append({
            "title": f"News: {news['title']}",
            "category": "News",
            "content": f"Title: {news['title']}\nDate: {news['date']}\nDescription: {news['description']}"
        })

    # 12. Miscellaneous
    chunks.append({
        "title": "Campus Activities and Clubs",
        "category": "Campus Life",
        "content": "Activities and Clubs include: " + flatten_list(data.get("campus_activities_and_clubs", []))
    })
    chunks.append({
        "title": "Notable Alumnae",
        "category": "General",
        "content": "Our notable alumnae include: " + flatten_list(data.get("notable_alumnae", []))
    })
    chunks.append({
        "title": "Recruiters",
        "category": "Placement",
        "content": "Our regular recruiters include: " + flatten_list(data.get("Our recruiters", []))
    })

    return chunks

def ingest():
    if not os.path.exists(JSON_PATH):
        print(f"Error: {JSON_PATH} not found.")
        return

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    chunks = create_chunks(data)
    print(f"Extracted {len(chunks)} chunks from structured knowledge base.")

    # Initialize ChromaDB
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    
    # Delete collection if exists to start fresh
    try:
        client.delete_collection(COLLECTION_NAME)
        print(f"Deleted existing collection '{COLLECTION_NAME}'")
    except:
        pass
    
    collection = client.create_collection(name=COLLECTION_NAME)
    
    # Initialize embedding model
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Prepare data for insertion
    ids = [str(i) for i in range(len(chunks))]
    documents = [f"Title: {c['title']}\nCategory: {c['category']}\n\n{c['content']}" for c in chunks]
    metadatas = [{"title": c['title'], "category": c['category']} for c in chunks]
    
    print("Computing embeddings and inserting into ChromaDB...")
    # Insert in batches
    batch_size = 50
    for i in range(0, len(chunks), batch_size):
        end = min(i + batch_size, len(chunks))
        batch_docs = documents[i:end]
        batch_ids = ids[i:end]
        batch_metas = metadatas[i:end]
        
        batch_embeddings = model.encode(batch_docs).tolist()
        
        collection.add(
            ids=batch_ids,
            embeddings=batch_embeddings,
            documents=batch_docs,
            metadatas=batch_metas
        )
        print(f"Inserted batch {i//batch_size + 1}")

    print(f"Successfully ingested {len(chunks)} chunks into ChromaDB.")

if __name__ == "__main__":
    ingest()
