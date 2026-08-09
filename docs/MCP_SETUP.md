# MCP Setup - Stitch

El servidor MCP `stitch` de Google está configurado con las siguientes credenciales y endpoint:

```json
{
  "mcpServers": {
    "stitch": {
      "serverUrl": "https://stitch.googleapis.com/mcp",
      "headers": {
        "X-Goog-Api-Key": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

### Ubicación de archivos configurados:
1. **Global Antigravity / Gemini:** `C:\Users\pedro\.gemini\config\mcp_config.json`
2. **VS Code:** `.vscode/mcp.json`
3. **Cursor:** `.cursor/mcp.json`
