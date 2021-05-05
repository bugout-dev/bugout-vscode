# Bugout

This extension helps you to work with [Bugout.dev](https://bugout.dev) knowledgebase without ever leaving VSCode.

## Features

- Exceptions and errors Hover
- Search across all crash reports
- Edit and create new entries in knowledgebase

Supported languages: `Python`, `Javascript` and `Go`. Let us know what [your favorite language](https://bugout.dev/)?

### Look for an Exception in crash reports

Select Exception in your code to get additional information about it. Follow by link `Details ->` to see filtered exceptions in your crash report journal.

![Selected exception in code](https://s3.amazonaws.com/static.simiotics.com/bugout-dev-docs/bugout-vscode-hover-exception-search.gif)

### Create and edit entries in your personal knowledgebase

Choose journal you want to add entry, create or modify existing record.

![Edit entry](https://s3.amazonaws.com/static.simiotics.com/bugout-dev-docs/bugout-vscode-edit-entry.gif)

## Installation

### Your personal knowledgebase

In order to use this extension, you will have to create an account on [Bugout.dev](https://bugout.dev).
Once you have verified your email address, click on your username in the top left and go to your `Account` page, then on your `Account` page, select `Tokens`.

Click on the `+` button to create a new token (you will have to provide your password here). You should now
see an access token. `Keep this token secret!`

![New token](https://s3.amazonaws.com/static.simiotics.com/bugout-dev-docs/bugout-create-token.png)

Copy that access token and go to your VSCode settings screen. You can either do this by selecting `File > Preferences > Settings` (this is `Code > Preferences > Settings` on a Mac) or by hitting `Ctrl + ,`. In the `Search settings` bar, type `bugout`.

![Bugout settings in VS Code](https://s3.amazonaws.com/static.simiotics.com/bugout-dev-docs/bugout-vscode-settings.png)

Paste your access token into the `Bugout: Access Token` setting and click your mouse away. Any knowledge you store from VSCode is automatically synchronized with Bugout.

![New entry in journal](https://s3.amazonaws.com/static.simiotics.com/bugout-dev-docs/bugout-personal-entry-from-vscode.png)

### Your crash reports journal

In order to work Hover feature you need to link your Humbug journal from Bugout. Create team and add crash report integration.

![Adding new Humbug integration](https://s3.amazonaws.com/static.simiotics.com/bugout-dev-docs/bugout-create-team.png)

When Integration will be created, copy and insert `journal id` to VSCode Bugout settings.

![Copy crash reports journal id](https://s3.amazonaws.com/static.simiotics.com/bugout-dev-docs/bugout-create-humbug-journal.png)

**Changing Bugout settings requires restart of the VSCode application**

## Afterwords

You can find detailed instructions for setting up Bugout in VSCode, as well as in Slack, GitHub, and your terminal in our [documentation repository](https://github.com/bugout-dev/docs/blob/main/tutorials/vscode-setup.md).

Good luck and happy hacking!
