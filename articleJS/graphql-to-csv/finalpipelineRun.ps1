# Configuration: Paths for Node.js, JavaScript, CSV, Project, and Slack Webhook
$nodePath = "C:/Program Files/nodejs/node.exe"
$scriptPath = "C:/Users/hugos/OneDrive - Realm of Caring Foundation/Desktop/articleJS/graphql-to-csv/index_test_bookmark.js"


$sourceFile = "C:\Users\hugos\OneDrive - Realm of Caring Foundation\Desktop\articleJS\articles.csv"
$projectName = "[project_name]"  # Replace this with the actual project name
$destinationFolder = "C:/Users/hugos/OneDrive - Realm of Caring Foundation/Desktop/mage.ai/$projectName/Clean_Data"
$destinationFile = "$destinationFolder/articles_with_keywords.csv"
$uriSlack = "https://hooks.slack.com/services/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"  # Slack webhook URL

# Step 1: Run JavaScript file using Node.js
Write-Output "[INFO] Running JavaScript script: $scriptPath"
try {
    & "$nodePath" "$scriptPath"
    Write-Output "[INFO] JavaScript script executed successfully."
} catch {
    Write-Error "[ERROR] Failed to run JavaScript script."
}

# Step 2: Ensure destination folder exists
if (-not (Test-Path -Path $destinationFolder)) {
    New-Item -ItemType Directory -Path $destinationFolder -Force | Out-Null
    Write-Output "[INFO] Created destination folder: $destinationFolder"
} else {
    Write-Output "[INFO] Destination folder already exists: $destinationFolder"
}

# Step 3: Copy CSV file to the new location
try {
    Copy-Item -Path $sourceFile -Destination $destinationFile -Force
    Write-Output "[INFO] CSV file copied to $destinationFile"
} catch {
    Write-Error "[ERROR] Failed to copy CSV file to destination."
}

# Step 5: Send notification to Slack
$body = ConvertTo-Json @{
    pretext = "Articles Update Ran Successfully"
    text = "The articles data has been updated successfully and duplicates removed."
    color = "#142954"
}
try {
    Invoke-RestMethod -Uri $uriSlack -Method Post -Body $body -ContentType 'application/json' | Out-Null
    Write-Output "[INFO] Update to Slack was successful."
} catch {
    Write-Error "[ERROR] Failed to send update to Slack."
}

# Step 6: Pause PowerShell window to keep it open for review
Read-Host -Prompt "Press Enter to exit"
