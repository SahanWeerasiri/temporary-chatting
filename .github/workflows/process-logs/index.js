const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function run() {
    try {
        const token = core.getInput('github-token');
        const specifiedRunId = core.getInput('run-id');

        const octokit = github.getOctokit(token);
        const context = github.context;

        const runId = specifiedRunId || context.runId;

        // Get owner and repo from context
        const owner = context.repo.owner;
        const repo = context.repo.repo;

        console.log(`🔍 Fetching logs for run: ${runId}`);
        console.log(`📁 Repository: ${owner}/${repo}`);

        // Get logs archive
        const { data: logBuffer } = await octokit.rest.actions.downloadWorkflowRunLogs({
            owner,
            repo,
            run_id: runId,
        });

        // Save the zip file
        const outputDir = path.join(process.env.GITHUB_WORKSPACE || '.', 'fetched-logs');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const zipPath = path.join(outputDir, `run-${runId}-logs.zip`);
        fs.writeFileSync(zipPath, Buffer.from(logBuffer));

        // Extract the zip
        execSync(`unzip -o "${zipPath}" -d "${outputDir}"`);

        // Find log files
        const logFiles = [];
        function findLogFiles(dir) {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    findLogFiles(fullPath);
                } else if (file.endsWith('.txt') || file === '0_Setup SSH.txt' || file === '1_Pull and Deploy.txt') {
                    logFiles.push(fullPath);
                }
            }
        }

        findLogFiles(outputDir);

        // Combine all logs
        const combinedLogs = [];
        for (const logFile of logFiles) {
            try {
                const content = fs.readFileSync(logFile, 'utf8');
                const fileName = path.relative(outputDir, logFile);
                combinedLogs.push(`=== ${fileName} ===`);
                combinedLogs.push(content);
                combinedLogs.push(''); // Empty line between files
            } catch (error) {
                console.warn(`⚠️ Could not read file ${logFile}: ${error.message}`);
            }
        }

        const combinedPath = path.join(outputDir, 'combined-logs.txt');
        fs.writeFileSync(combinedPath, combinedLogs.join('\n'));

        // Set outputs
        core.setOutput('logs-path', combinedPath);
        core.setOutput('log-url', `https://github.com/${owner}/${repo}/actions/runs/${runId}`);

        console.log(`✅ Logs saved to: ${combinedPath}`);
        console.log(`📊 Total log files found: ${logFiles.length}`);
        console.log(`🔗 View in browser: https://github.com/${owner}/${repo}/actions/runs/${runId}`);

        // Return the combined logs content
        return combinedLogs.join('\n');

    } catch (error) {
        core.setFailed(`Failed to fetch logs: ${error.message}`);
        console.error('Full error details:', error);
        throw error;
    }
}

// Export for testing if needed
if (require.main === module) {
    run();
}

module.exports = { run };