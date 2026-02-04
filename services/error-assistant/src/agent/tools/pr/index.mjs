/**
 * PR tools - create pull requests
 */

import git from 'isomorphic-git';
import fs from 'fs/promises';
import { createPR } from '../../../pr.mjs';
import { sendEmail } from '../../../mailer.mjs';
import { BRANCH } from '../../../config.mjs';

/**
 * create_pr tool - creates a git branch, commits changes, and opens a pull request
 */
export const createPrTool = {
  name: 'create_pr',
  signature: 'create_pr --branch-name "<name>" --commit-title "<title>" [--commit-desc "<desc>"] [--pr-title "<title>"] [--pr-desc "<desc>"]',
  docstring: 'Creates a git branch with staged changes and opens a pull request. Commits all staged changes to the new branch and creates a PR against the base branch.',
  arguments: [
    {
      name: 'branch-name',
      type: 'string',
      description: 'Name for the new branch (e.g., "fix/null-pointer-error")',
      required: true,
    },
    {
      name: 'commit-title',
      type: 'string',
      description: 'Title/summary for the commit message',
      required: true,
    },
    {
      name: 'commit-desc',
      type: 'string',
      description: 'Extended description for the commit message',
      required: false,
    },
    {
      name: 'pr-title',
      type: 'string',
      description: 'Title for the pull request (defaults to commit-title if not provided)',
      required: false,
    },
    {
      name: 'pr-desc',
      type: 'string',
      description: 'Description/body for the pull request (defaults to commit-desc if not provided)',
      required: false,
    },
  ],
  async execute(env, args) {
    const repoRoot = env.repoRoot ?? env.cwd ?? process.cwd();

    // Extract parameters from args
    const branchName = args['branch-name'] || args.branchname || `fix/${Date.now().toString(36)}`;
    const commitTitle = args['commit-title'] || args.committitle || 'Fix: Error resolved by AI agent';
    const commitDesc = args['commit-desc'] || args.commitdesc || '';
    const prTitle = args['pr-title'] || args.prtitle || commitTitle;
    const prDesc = args['pr-desc'] || args.prdesc || commitDesc;

    // Get required environment variables
    const repoUrl = process.env.REPO_URL;
    const appId = process.env.GITHUB_APP_ID;
    const installationId = process.env.GITHUB_INSTALLATION_ID;
    const privateKeyPath = process.env.GITHUB_APP_PRIVATE_KEY_PATH;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
    const baseBranch = BRANCH; // Use configured base branch from config

    if (!repoUrl) {
      return 'Error: REPO_URL environment variable is required for create_pr';
    }

    if (!appId || !installationId || !(privateKey || privateKeyPath)) {
      return 'Error: GitHub App credentials required: GITHUB_APP_ID, GITHUB_INSTALLATION_ID, and GITHUB_APP_PRIVATE_KEY';
    }

    // Get git user from config (use repo root where .git lives)
    let authorName, authorEmail;
    try {
      const name = await git.getConfig({ fs, dir: repoRoot, path: 'user.name' });
      const email = await git.getConfig({ fs, dir: repoRoot, path: 'user.email' });
      authorName = name || undefined;
      authorEmail = email || undefined;
    } catch {}

    const result = await createPR({
      repoPath: repoRoot,
      branchName,
      commitTitle,
      commitDescription: commitDesc,
      prTitle,
      prDescription: prDesc,
      baseBranch,
      repoUrl,
      appId,
      installationId,
      privateKeyPath,
      privateKey,
      authorName,
      authorEmail,
    });

    if (result.success) {
      // Send email notification
      try {
        const notificationEmail = process.env.DEFAULT_NOTIFICATION_EMAIL || null;
        const fromEmail = process.env.FROM_EMAIL;

        if (!notificationEmail) {
          console.warn('[create_pr] DEFAULT_NOTIFICATION_EMAIL not set, skipping email notification');
        } else if (!fromEmail) {
          console.warn('[create_pr] FROM_EMAIL not set, skipping email notification');
        } else {
          const emailSubject = `PR Created: ${prTitle}`;
          const emailBody = `A pull request has been created by the error-assistant agent to fix an error.

PR Details:
- Title: ${prTitle}
- Branch: ${result.branch}
- Commit: ${result.commit}
- PR URL: ${result.prUrl}
- PR #${result.prNumber}

${prDesc ? `Description:\n${prDesc}\n\n` : ''}View the PR: ${result.prUrl}`;

          const formattedFrom = `Error Assistant <${fromEmail}>`;

          await sendEmail({
            to: notificationEmail,
            from: formattedFrom,
            subject: emailSubject,
            body: emailBody,
          });
        }
      } catch (emailError) {
        console.error('[create_pr] Failed to send email notification:', emailError.message);
      }

      return `✅ PR created successfully!\nBranch: ${result.branch}\nCommit: ${result.commit}\nPR: ${result.prUrl}\nPR #${result.prNumber}`;
    } else {
      return `❌ Failed to create PR: ${result.error || 'Unknown error'}`;
    }
  },
};
