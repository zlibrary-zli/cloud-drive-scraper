import os
import subprocess
import sys
import shutil

def run_cmd(cmd, cwd=None):
    print(f"\n>>> Running: {cmd}")
    subprocess.check_call(cmd, shell=True, cwd=cwd)

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")
    static_dir = os.path.join(root_dir, "static")
    
    print("=============================================")
    print("🚀 准备本地打包：前端 + 后端整合为单一执行文件")
    print("=============================================")

    # 1. 编译前端
    print("\n[1/4] 开始编译 React 前端...")
    run_cmd("npm install", cwd=frontend_dir)
    run_cmd("npm run build", cwd=frontend_dir)

    # 2. 拷贝前端静态文件
    print("\n[2/4] 复制静态文件到后端目录...")
    if os.path.exists(static_dir):
        shutil.rmtree(static_dir)
    shutil.copytree(os.path.join(frontend_dir, "dist"), static_dir)
    print(f"静态文件已复制到: {static_dir}")

    # 3. 安装 PyInstaller
    print("\n[3/4] 确保已安装 PyInstaller...")
    run_cmd(f"{sys.executable} -m pip install pyinstaller")

    # 4. 使用 PyInstaller 打包
    print("\n[4/4] 开始将 Python 后端与前端打包为单一可执行文件...")
    # 根据操作系统设置分隔符
    sep = ";" if os.name == "nt" else ":"
    
    pyinstaller_cmd = [
        f"{sys.executable}", "-m", "PyInstaller",
        "--name", "CloudDriveScraper",
        "--onefile",
        "--noconfirm",
        "--clean",
        f"--add-data", f"static{sep}static",
        "main.py"
    ]
    
    run_cmd(" ".join(pyinstaller_cmd), cwd=root_dir)

    print("\n=============================================")
    print("🎉 打包完成！")
    print(f"你可以进入 {os.path.join(root_dir, 'dist')} 目录，双击运行 CloudDriveScraper")
    print("运行后，它会自动打开浏览器访问控制台界面。")
    print("=============================================")

if __name__ == "__main__":
    main()
