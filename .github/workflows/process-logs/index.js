

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
        const owner = context.repo.owner;
        const repo = context.repo.repo;

        console.log(`🔍 Fetching logs for run: ${runId}`);
        console.log(`📁 Repository: ${owner}/${repo}`);

        // Fetch logs
        const { data: logBuffer } = await octokit.rest.actions.downloadWorkflowRunLogs({
            owner,
            repo,
            run_id: runId,
        });

        console.log('✅ Logs fetched successfully.');

        if (!logBuffer) {
            console.log('⚠️ No logs found or empty response.');
            return;
        }

        console.log(`📦 Log size: ${logBuffer.length} bytes`);

        // Save the zip file
        const outputDir = path.join(process.env.GITHUB_WORKSPACE || '.', 'fetched-logs');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        console.log(`💾 Saving logs to directory: ${outputDir}`);

        const zipPath = path.join(outputDir, `run-${runId}-logs.zip`);
        fs.writeFileSync(zipPath, Buffer.from(logBuffer));
        console.log(`✅ Logs saved to zip: ${zipPath}`);

        // Extract the zip
        try {
            execSync(`unzip -o "${zipPath}" -d "${outputDir}"`);
            console.log('✅ Zip extracted.');
        } catch (e) {
            console.error('❌ Failed to extract zip:', e.message);
            return;
        }

        // List extracted files
        function listFiles(dir) {
            let results = [];
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    results = results.concat(listFiles(fullPath));
                } else {
                    results.push(fullPath);
                }
            }
            return results;
        }
        const extractedFiles = listFiles(outputDir);
        console.log('📄 Extracted files:');
        extractedFiles.forEach(f => console.log('  -', f));
    } catch (error) {
        console.error('❌ Failed to fetch or extract logs:', error.message);
    }
}

if (require.main === module) {
    run();
}