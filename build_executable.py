import os
import subprocess
import shutil
import sys

def run_command(command, cwd=None):
    print(f"Running: {command}")
    result = subprocess.run(command, shell=True, cwd=cwd)
    if result.returncode != 0:
        print(f"Error executing {command}")
        sys.exit(1)

def main():
    # 1. Install PyInstaller
    print("--- Installing PyInstaller ---")
    run_command("pip install pyinstaller")

    # 2. Build Frontend
    print("--- Building Frontend ---")
    if not os.path.exists("node_modules"):
        run_command("npm install")
    run_command("npm run build")

    # 3. Prepare Backend for Packing
    # We need to ensure the backend can find the dist folder relative to itself inside the exe
    # PyInstaller extracts to _MEIxxxx temp folder.
    
    # Create the spec file or run pyinstaller directly
    print("--- Building Executable with PyInstaller ---")
    
    # Arguments:
    # --name FreeGPT : Name of exe
    # --onefile : Single .exe file (easier for users)
    # --add-data "dist;dist" : Include the frontend build
    # --add-data ".env;." : Include .env (WARNING: Users should probably provide their own, but for portability we might want to prompt or check)
    # --hidden-import ... : Add hidden imports often missed by PyInstaller
    
    # Note: On Windows use ; for separator, on Linux/Mac use :
    sep = ";" if os.name == 'nt' else ":"
    
    cmd = [
        "pyinstaller",
        "--name", "FreeGPT",
        "--onefile",
        "--clean",
        "--icon", "icon.ico",
        "--add-data", f"dist{sep}dist",
        "--add-data", f"backend{sep}backend", # Include backend source if needed for dynamic loading, or just relies on main
        # We need specific hidden imports for langchain/chromadb usually
        "--hidden-import", "uvicorn.logging",
        "--hidden-import", "uvicorn.loops",
        "--hidden-import", "uvicorn.loops.auto",
        "--hidden-import", "uvicorn.protocols",
        "--hidden-import", "uvicorn.protocols.http",
        "--hidden-import", "uvicorn.protocols.http.auto",
        "--hidden-import", "uvicorn.lifespan",
        "--hidden-import", "uvicorn.lifespan.on",
        "--hidden-import", "sklearn.utils._cython_blas",
        "--hidden-import", "sklearn.neighbors.typedefs",
        "--hidden-import", "sklearn.neighbors.quad_tree",
        "--hidden-import", "sklearn.tree._utils",
        "--hidden-import", "langchain.chains.retrieval",
        "--hidden-import", "langchain.chains.combine_documents",
        "--hidden-import", "langchain.chains.combine_documents.stuff",
        "--hidden-import", "langchain_community.embeddings",
        "--hidden-import", "langchain_community.vectorstores",
        "--hidden-import", "chromadb",
        "--hidden-import", "chromadb.config",
        "--hidden-import", "chromadb.telemetry.product.posthog",
        "--hidden-import", "chromadb.telemetry.product",
        "--hidden-import", "chromadb.api.rust",
        "--hidden-import", "chromadb.api.segment",
        "--hidden-import", "chromadb.db.impl.sqlite",
        "--hidden-import", "chromadb.migrations",
        "--hidden-import", "posthog",
        "--hidden-import", "python_multipart",
        "--hidden-import", "langchain_core.prompts",
        "--hidden-import", "tiktoken_ext",
        "--hidden-import", "tiktoken_ext.openai_public",
        "--collect-all", "tiktoken",
        "backend/main.py"
    ]
    
    # Convert list to string
    full_cmd = " ".join(cmd)
    run_command(full_cmd)

    print("\n--- BUILD COMPLETE ---")
    print("The executable is located in the 'dist' folder (not the frontend dist, but the root dist).")
    print("Look for: dist/FreeGPT.exe")

if __name__ == "__main__":
    main()
