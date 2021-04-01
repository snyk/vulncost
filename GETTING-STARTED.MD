# Adding the Extension
To get started with the Vuln Cost Security Scanner extension for Visual Studio Code (VSCode), you must first install the *Vuln Cost - Security Scanner* by `snyk-security.vscode-vuln-cost` from the **Extensions Marketplace**. You may need to restart VSCode to see warnings.

You can tell the extension is successfully installed by opening your `package.json` or equivalent. You should see **Scanning for vulns…** appear next to all of your dependencies.  If a dependency version doesn’t match known vulnerable versions in Snyk’s database, the message will disappear. If the version matches a known-vulnerable one, the text will change to show the number of vulnerabilities in a message like `2 vulns (click to fix)`. You can’t actually click to fix until you [authorize your account](#authorizing-your-account), though, and the text saying `(click to fix)` is not clickable.

# Viewing Vulnerability Details
Click within the name of a dependency that lists a number of vulns, and a blue extension icon will appear in the left margin of VSCode. When you click the extension icon, a dropdown appears with two options: **Fix Vulns** or **Learn about this package**.  

If you select **Fix Vulns**,  VSCode asks if you would like to go to the external webpage. If you haven’t authorized Snyk CLI since installing the extension, you will need to [authorize your account](#authorizing-your-account) to actually see fix options. If you have already authorized Snyk CLI, the **Output** panel lists direct and indirect vulnerabilities known to affect your package version, as well as a version to upgrade to for possible remediation. 

If you select  **Learn about this package**, VSCode asks if you would like to go to the external webpage, and agreeing takes you to the Snyk Advisor page for that package.  

# Authorizing Your Account
The first time you use the Vuln Cost Security Scanner on a new device, you will need to authorize it by logging into your Snyk account before seeing remediation advice. 
1. First, find a package with known vulnerabilities in your `package.json` or equivalent. 
2. Click in the name of that package, then click the blue extension icon that appears in the left margin.
A dropdown menu opens.
3. Select **Fix Vulns** from the dropdown.
VSCode will ask if you want to open the External Link. You must open the external link to continue. 
![Open The External Website - Vuln Cost](https://user-images.githubusercontent.com/1719499/113234978-2bd32500-9257-11eb-9d21-70a02abcfa1b.png)
4. Click Open. 
An **Authenticate for CLI** prompt appears. This is because the Snyk CLI tool performs the underlying lookups to determine whether your packages are known vulnerable. ![Authenticate for CLI - Vuln Cost](https://user-images.githubusercontent.com/1719499/113234976-2b3a8e80-9257-11eb-8eda-ba02a7e40569.png)
5. Click **Authenticate** to allow the Snyk CLI to scan your package versions.
An **Authenticated** screen should appear. If it doesn’t, reload the page and try again. ![Authenticated - Vuln Cost](https://user-images.githubusercontent.com/1719499/113234975-2aa1f800-9257-11eb-9043-2c823e40279f.png)
6. Click in the name of your package and select **Fix Vulns** again, and you will now see direct and indirect vulnerabilities known to affect your package version, as well as a version to upgrade to for possible remediation in the **Output** panel of VSCode. 
