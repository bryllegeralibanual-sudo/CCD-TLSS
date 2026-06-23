from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET
p = Path(r'C:/Users/Quira/Downloads/CCD_Curriculum.docx')
print('DOCX path exists:', p.exists())
if not p.exists():
    raise SystemExit(1)
with ZipFile(p, 'r') as z:
    names = z.namelist()
    print('Contains document.xml:', 'word/document.xml' in names)
    xml = z.read('word/document.xml')
    root = ET.fromstring(xml)
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    texts = [t.text for t in root.findall('.//w:t', ns) if t.text]
    joined = ' '.join(texts)
    print('---DOCX TEXT PREVIEW---')
    print(joined[:5000])
    print('---END PREVIEW---')
