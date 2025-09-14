import shutil
import os
import pandas as pd
import subprocess
import sys

# Function to ensure dependencies are installed
def install_dependencies():
    """
    Checks if necessary dependencies are installed (requests, pandas) and installs them if not.
    """
    try:
        # Check and install 'requests' if not installed
        import requests
    except ImportError:
        print("[INFO] 'requests' not found. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])

    try:
        # Check and install 'pandas' if not installed
        import pandas
    except ImportError:
        print("[INFO] 'pandas' not found. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pandas"])

# Function to run a Node.js script
def run_node_script(script_path):
    """
    Executes a Node.js script from a given path.

    :param script_path: Path to the Node.js script.
    :return: True if the script ran successfully, False otherwise.
    """
    try:
        # Ensure the path is wrapped in double quotes to handle spaces
        result = os.system(f'node "{script_path}"')
        if result == 0:
            print(f"[INFO] Node.js script '{script_path}' ran successfully.")
            return True
        else:
            print(f"[ERROR] Node.js script failed with exit code {result}.")
            return False
    except Exception as e:
        print(f"[ERROR] Exception occurred while running the Node.js script: {e}")
        return False


# Function to move the CSV file
def move_csv_file(source, destination):
    """
    Moves a CSV file from the source location to the destination folder.

    :param source: Path to the source CSV file.
    :param destination: Path to the destination folder.
    :return: The new path to the moved CSV file if successful, None otherwise.
    """
    try:
        if not os.path.exists(destination):
            os.makedirs(destination)  # Ensure the destination folder exists

        # Get the file name from the source path
        file_name = os.path.basename(source)
        destination_path = os.path.join(destination, file_name)

        # Move the file
        shutil.move(source, destination_path)
        print(f"[INFO] File moved to {destination_path}")
        return destination_path
    except Exception as e:
        print(f"[ERROR] Exception occurred while moving the file: {e}")
        return None


# Function to remove duplicates from the CSV file
def remove_duplicates_from_csv(file_path):
    """
    Removes duplicate rows from the given CSV file, handling inconsistent columns.
    
    :param file_path: Path to the CSV file to process.
    """
    try:
        # Read the CSV file into a DataFrame, skip bad lines with inconsistent columns
        df = pd.read_csv(file_path, on_bad_lines='skip')  # For newer pandas versions

        # Remove duplicates
        df.drop_duplicates(inplace=True)

        # Save the cleaned CSV file back
        df.to_csv(file_path, index=False)
        print(f"[INFO] Duplicates removed from {file_path} and file saved.")
    except Exception as e:
        print(f"[ERROR] Exception occurred while removing duplicates from CSV: {e}")


# Main function to orchestrate the steps
def main():
    # Ensure dependencies are installed
    install_dependencies()

    # Define paths
    node_script_path = r'C:/Users/hugos/OneDrive - Realm of Caring Foundation/Desktop/articleJS/graphql-to-csv/index_test_bookmark.js'
    source_csv_file = r'C:/Users/hugos/OneDrive - Realm of Caring Foundation/Desktop/articleJS/graphql-to-csv/articles.csv'
    destination_folder = r'C:/Users/hugos/OneDrive - Realm of Caring Foundation/Desktop/mage.ai/[project_name]/Clean_Data/'

    print("Starting script execution...")

    # Step 1: Run the Node.js script
    print("Step 1: Running Node.js script...")
    if not run_node_script(node_script_path):
        print("Node.js script execution failed. Exiting.")
        return

    # Step 2: Move the CSV file
    print("Step 2: Moving the CSV file...")
    moved_csv_file = move_csv_file(source_csv_file, destination_folder)
    if not moved_csv_file:
        print("File move failed. Exiting.")
        return

    # Step 3: Remove duplicates from the moved CSV file
    print("Step 3: Removing duplicates from the CSV file...")
    remove_duplicates_from_csv(moved_csv_file)

    print("Script execution completed successfully.")

if __name__ == "__main__":
    main()

    # Keep the terminal open
    input("\nScript execution completed. Press Enter to exit...")
