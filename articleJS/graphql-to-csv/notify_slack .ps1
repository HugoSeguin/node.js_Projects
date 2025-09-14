# Set the path to the batch file
$batchFilePath = "C:\Users\hugos\OneDrive - Realm of Caring Foundation\Desktop\articleJS\graphql-to-csv\run.bat"

# Check if the batch file exists
if (Test-Path $batchFilePath) {
    try {
        # Run the batch file
        Write-Output "[INFO] Running batch file: $batchFilePath"
        & $batchFilePath

        # Check if the batch file executed successfully
        if ($LASTEXITCODE -eq 0) {
            Write-Output "[INFO] Batch file executed successfully."

            # Set the Slack webhook URL
            $uriSlack = "https://hooks.slack.com/services/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"

            # Define the JSON payload
            $body = ConvertTo-Json @{
                pretext = "Articles Update Ran Sucessfully"
                text = "This is the text below with a blue thingy next to it"
                color = "#142954"
            }

            # Send the notification to Slack
            try {
                Invoke-RestMethod -uri $uriSlack -Method Post -body $body -ContentType 'application/json' | Out-Null
                Write-Output "[INFO] Update to Slack was successful."
            } catch {
                Write-Error "$([datetime]::Now): Update to Slack went wrong..."
            }
        } else {
            Write-Error "$([datetime]::Now): Batch file execution failed with exit code $LASTEXITCODE."
        }
    } catch {
        Write-Error "$([datetime]::Now): An error occurred while running the batch file."
    }
} else {
    Write-Error "$([datetime]::Now): Batch file not found: $batchFilePath."
}

# Pause to keep the window open
Read-Host -Prompt "Press Enter to exit"

