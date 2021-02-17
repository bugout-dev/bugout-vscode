# Bugout

This extension helps you send knowledge to your Bugout journals without ever leaving VSCode.

In order to use this extension, you will have to create an account on [Bugout.dev](https://bugout.dev).


Once you have verified your email address, click on your username in the top right and go to your `Account` page:

<img src="https://s3.amazonaws.com/static.simiotics.com/bugout-dev-docs/bugout-accounts-menu.png" alt="Bugout.dev accounts menu" width="600"/>

On your `Account` page, select `Tokens`:

<img src="https://s3.amazonaws.com/static.simiotics.com/bugout-dev-docs/bugout-tokens-button.png" alt="Bugout.dev tokens menu" width="600"/>

Click on the `+` button to create a new token (you will have to provide your password here). You should now
see an access token:

<img src="https://s3.amazonaws.com/static.simiotics.com/bugout-dev-docs/bugout-tokens-access-token.png" alt="Bugout access token - this one is deidentified: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" width="600"/>

Copy that access token and go to your VSCode settings screen. You can either do this by selecting `File > Preferences > Settings` (this is `Code > Preferences > Settings` on a Mac) or by hitting `Ctrl + ,`. In the `Search settings` bar, type `bugout`:

<img src="https://s3.amazonaws.com/static.simiotics.com/bugout-dev-docs/bugout-vscode-settings.png" alt="" width="600"/>

Paste your access token into the `Bugout: Access Token` setting and click your mouse away:

<img src="https://s3.amazonaws.com/static.simiotics.com/bugout-dev-docs/bugout-vscode-settings-with-access-token.png" alt="Bugout access token" width="800"/>

Now, you can use Bugout to save knowledge from your VSCode tabs:

<img src="https://s3.amazonaws.com/static.simiotics.com/bugout-dev-docs/bugout-vscode-create-entry.gif" alt="An animation of the workflow to create a knowledge base entry from VSCode" width="600"/>

Any knowledge you store from VSCode is automatically synchronized to Bugout:

<img src="https://s3.amazonaws.com/static.simiotics.com/bugout-dev-docs/bugout-personal-entry-from-vscode.png" alt="Bugout personal journal now has the note from VSCode" width="600"/>


You can find detailed instructions for setting up Bugout in VSCode, as well as in Slack, GitHub, and your terminal in our[documentation repository](https://github.com/bugout-dev/docs/blob/main/tutorials/vscode-setup.md).

Good luck and happy hacking!
