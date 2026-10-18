import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "tacticalpassword123")

class Neo4jConnection:
    def __init__(self):
        self.driver = None

    def connect(self):
        if not self.driver:
            self.driver = GraphDatabase.driver(
                NEO4J_URI, 
                auth=(NEO4J_USER, NEO4J_PASSWORD)
            )

    def close(self):
        if self.driver:
            self.driver.close()
            self.driver = None

    def query(self, query: str, parameters: dict = None, db: str = None):
        self.connect()
        with self.driver.session(database=db) as session:
            result = session.run(query, parameters or {})
            return [record.data() for record in result]

    def execute_script(self, script_content: str):
        self.connect()
        # Filter comments and split by semicolon
        lines = []
        for line in script_content.splitlines():
            stripped = line.strip()
            if stripped.startswith("//") or not stripped:
                continue
            lines.append(line)
        cleaned_content = "\n".join(lines)
        statements = [stmt.strip() for stmt in cleaned_content.split(";") if stmt.strip()]
        
        results = []
        with self.driver.session() as session:
            for stmt in statements:
                res = session.run(stmt)
                summary = res.consume()
                results.append(summary)
        return results

db_client = Neo4jConnection()
