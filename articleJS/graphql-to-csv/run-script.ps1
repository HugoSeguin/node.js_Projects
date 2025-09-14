# Define paths for the Python script and virtual environment
$pythonScriptPath = "C:\Users\hugos\OneDrive - Realm of Caring Foundation\Desktop\articleJS\graphql-to-csv\update_articles.py"
$venvPath = "C:\Users\hugos\OneDrive - Realm of Caring Foundation\Desktop\articleJS\graphql-to-csv\venv"

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
# Function to activate the virtual environment
function Activate-Venv {
    param(
        [string]$venvPath
    )

    # Define the activation script for Windows
    $activateScript = Join-Path -Path $venvPath -ChildPath "Scripts\activate.bat"

    # Check if the activation script exists
    if (Test-Path $activateScript) {
        Write-Host "Activating virtual environment at: $venvPath" -ForegroundColor Green

        # Run the activation script in cmd.exe (required for .bat files on Windows)
        cmd.exe /c $activateScript
    } else {
        Write-Host "The virtual environment activation script does not exist: $activateScript" -ForegroundColor Red
        exit 1
    }
}

# Check if the Python script exists
if (Test-Path $pythonScriptPath) {
    try {
        # Activate the virtual environment
        Activate-Venv -venvPath $venvPath

        # Run the Python script
        Write-Host "Running the Python script: $pythonScriptPath" -ForegroundColor Green
        python $pythonScriptPath
        Write-Host "Python script completed successfully." -ForegroundColor Green
    } catch {
        Write-Host "Error running the Python script: $_" -ForegroundColor Red
    }
} else {
    Write-Host "The Python script file does not exist at the specified path: $pythonScriptPath" -ForegroundColor Yellow
}

# Prevent the terminal from closing
Write-Host "Press any key to exit..." -ForegroundColor Cyan
pause
