# Bugout

This extension helps you to work with [Bugout.dev](https://bugout.dev) knowledgebase without ever leaving VSCode.

## Features

- View usage and crash reports for your projects. See how your users are using each line of code in
  your codebase.
- Work with your Bugout knowledge bases - create, search for, and edit entries from VSCode.

Supported languages: `Python`, `Javascript` and `Go`. Let us know what [your favorite language](https://bugout.dev/)?

### How many users have experienced an error?

You can use the Bugout VSCode extension to see how many users have experienced a given error or
exception in your code base. Hover over the error to get additional information about it.Follow by link `Details ->` 
to view more information about each error, including the stack trace. Choose journal you want to add entry, create or modify existing record.
You can also search the crash report journal to get specific exceptions.

![Selected exception in code](https://s3.amazonaws.com/static.simiotics.com/bugout-dev-docs/bugout-vscode-hover-exception-search.gif)

### Edit entries in your personal knowledgebase

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

To view crash report information in VSCode, you will need to:
1. Activate usage and crash reporting for your project.
2. Add the ID for the journal containing your usage and crash reports to VSCode.

First, create a team and click on the `Install Usage Reports` button next to your team name.

![Adding new Humbug integration](https://s3.amazonaws.com/static.simiotics.com/bugout-dev-docs/bugout-create-team.png)

Once the integration is set up, copy the `Journal id`.

![Copy crash reports journal id](https://s3.amazonaws.com/static.simiotics.com/bugout-dev-docs/bugout-create-humbug-journal.png)

In your user or workspace settings in VSCode (`Ctrl + ,` on Windows or Linux, `Cmd + ,` on Mac),
search for `Bugout`, and add the copied journal ID under the `Bugout: Crash Reports Journal`
setting.

**Changing Bugout settings requires restart of the VSCode application**

## More information

You can find detailed instructions for setting up Bugout in VSCode, as well as in Slack, GitHub, and your terminal in our [documentation repository](https://github.com/bugout-dev/docs/blob/main/tutorials/vscode-setup.md).

Good luck and happy hacking!
