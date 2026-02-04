export const deploymentFailedTemplate = (
  projectName: string,
  deploymentUrl: string | null,
  commitMessage?: string,
  authorName?: string,
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deployment Failed</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      color: #111827;
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 500px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      margin-bottom: 32px;
    }
    .status-dot {
      height: 12px;
      width: 12px;
      background-color: #EF4444;
      border-radius: 50%;
      display: inline-block;
      margin-right: 8px;
    }
    .title {
      font-size: 24px;
      font-weight: 500;
      margin: 0 0 8px;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
    }
    .subtitle {
      color: #6B7280;
      font-size: 15px;
      margin: 0;
    }
    .card {
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .row:last-child {
      margin-bottom: 0;
    }
    .label {
      color: #6B7280;
    }
    .value {
      font-weight: 500;
      text-align: right;
    }
    .button {
      background-color: #ffffff;
      color: #111827;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      display: inline-block;
      border: 1px solid #E5E7EB;
      transition: background-color 0.2s;
    }
    .button:hover {
        background-color: #F9FAFB;
    }
    .footer {
      margin-top: 40px;
      border-top: 1px solid #E5E7EB;
      padding-top: 20px;
      font-size: 12px;
      color: #9CA3AF;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1 class="title">
        <span class="status-dot"></span>
        Deployment Failed
      </h1>
      <p class="subtitle">
        The deployment for <strong>${projectName}</strong> was unsuccessful.
      </p>
    </div>

    <div class="card">
      <div class="row">
        <span class="label">Project</span>
        <span class="value">${projectName}</span>
      </div>
      ${
        authorName
          ? `
      <div class="row">
        <span class="label">Initiated by</span>
        <span class="value">${authorName}</span>
      </div>`
          : ""
      }
      ${
        commitMessage
          ? `
      <div class="row">
        <span class="label">Commit</span>
        <span class="value" style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${commitMessage}</span>
      </div>`
          : ""
      }
    </div>

    <div style="text-align: center;">
      <a href="https://code2cloud.dev/projects" class="button">View Build Logs</a>
    </div>

    <div class="footer">
      <p>Sent by Code2Cloud</p>
    </div>
  </div>
</body>
</html>
`;
