import os
import sys
import subprocess
import time
import signal
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

def main():
    print("================================================================")
    print("           Starting ShipSense AI Platform (Full-Stack)          ")
    print("================================================================")

    # 1. Start FastAPI Backend
    python_exe = ROOT_DIR / ".venv" / "Scripts" / "python.exe"
    if not python_exe.exists():
        python_exe = Path(sys.executable)

    backend_cmd = [
        str(python_exe),
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
        "--reload",
    ]

    print(f"\n[1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ...")
    backend_env = os.environ.copy()
    backend_env["PYTHONPATH"] = f"{BACKEND_DIR};{ROOT_DIR}"
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(BACKEND_DIR),
        env=backend_env
    )

    # 2. Start Vite Frontend
    print(f"[2/2] Launching Vite Frontend on http://localhost:5173 ...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=str(FRONTEND_DIR)
    )

    print("\n----------------------------------------------------------------")
    print(" ShipSense Platform is live:")
    print(" • Frontend UI: http://localhost:5173")
    print(" • Backend API: http://127.0.0.1:8000")
    print(" • Swagger Docs: http://127.0.0.1:8000/docs")
    print(" Press Ctrl+C to stop all servers.")
    print("----------------------------------------------------------------\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down ShipSense servers gracefully...")
        backend_proc.terminate()
        frontend_proc.terminate()
        try:
            backend_proc.wait(timeout=3)
            frontend_proc.wait(timeout=3)
        except Exception:
            backend_proc.kill()
            frontend_proc.kill()
        print("Shutdown complete.")

if __name__ == "__main__":
    main()
