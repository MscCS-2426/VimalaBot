import json
import zipfile
import xml.etree.ElementTree as ET
import os
import re

def extract_text_from_docx(docx_path):
    document_xml_path = 'word/document.xml'
    try:
        with zipfile.ZipFile(docx_path) as docx:
            xml_content = docx.read(document_xml_path)
    except Exception as e:
        print(f"Error opening docx: {e}")
        return []

    tree = ET.fromstring(xml_content)
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    
    paragraphs = []
    for p in tree.findall('.//w:p', namespaces=ns):
        texts = p.findall('.//w:t', namespaces=ns)
        if texts:
            para_text = ''.join([t.text for t in texts]).strip()
            if para_text:
                paragraphs.append(para_text)
    return paragraphs

def parse_document(paragraphs):
    """
    Parses paragraphs into a structured JSON format.
    Handles general college info, news, and specifically structured course info.
    """
    structured_data = []
    
    # States for course parsing
    current_course = None
    current_course_data = {}
    
    general_buffer = []
    
    for p in paragraphs:
        # Check if it's a course heading like "**B Voc Web Technology**" or "**[B Sc Physics](link)**"
        course_match = re.match(r'^\*\*(?:\[)?(B\s?(?:Sc|A|Voc|Com)[^\]\*]+)(?:\]\([^\)]+\))?\*\*$', p.strip())
        
        if course_match:
            # Save previous course if exists
            if current_course:
                structured_data.append({
                    "category": "Course",
                    "title": current_course,
                    "content": json.dumps(current_course_data)
                })
            
            # Start new course
            current_course = course_match.group(1).strip()
            current_course_data = {}
            continue
            
        if current_course:
            # Look for structured fields inside course
            field_match = re.match(r'^\*\*(Eligibility|Index Mark|Tie Break|Indexing Ruling)[\s:]*\*\*(.*)', p.strip())
            if field_match:
                key = field_match.group(1).strip()
                val = field_match.group(2).strip()
                current_course_data[key] = val
                continue
            
            # If it's the `×` separator, it might mean end of course section
            if p.strip() == '×':
                structured_data.append({
                    "category": "Course Details",
                    "title": current_course,
                    "content": "\n".join([f"{k}: {v}" for k, v in current_course_data.items()])
                })
                current_course = None
                current_course_data = {}
                continue
            
            # If it's a continuation of the previous field
            if current_course_data:
                last_key = list(current_course_data.keys())[-1]
                current_course_data[last_key] += " " + p.strip()
            else:
                # General course info
                current_course_data["General"] = current_course_data.get("General", "") + " " + p.strip()
        else:
            # General information
            # Skip noise like UI artifacts
            noise = ['![', '![](https', 'Skip to content', 'Go to Top', '[Page load link]']
            if any(n in p for n in noise):
                continue
                
            general_buffer.append(p)
            
            # Chunk general text every ~500 chars
            if len('\n'.join(general_buffer)) > 500:
                structured_data.append({
                    "category": "General Information",
                    "title": "College Information",
                    "content": '\n'.join(general_buffer)
                })
                general_buffer = []

    # Clean up remaining
    if current_course:
        structured_data.append({
            "category": "Course Details",
            "title": current_course,
            "content": "\n".join([f"{k}: {v}" for k, v in current_course_data.items()])
        })
        
    if general_buffer:
        structured_data.append({
            "category": "General Information",
            "title": "College Information",
            "content": '\n'.join(general_buffer)
        })

    return structured_data

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    docx_path = os.path.join(base_dir, 'export', 'all_edited.docx')
    json_path = os.path.join(base_dir, 'backend', 'data', 'knowledge_base.json')
    
    os.makedirs(os.path.dirname(json_path), exist_ok=True)
    
    paragraphs = extract_text_from_docx(docx_path)
    structured_data = parse_document(paragraphs)
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(structured_data, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully extracted {len(structured_data)} structured items into {json_path}")

if __name__ == "__main__":
    main()
