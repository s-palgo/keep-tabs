# tabs

#### Install: <https://chrome.google.com/webstore/detail/keep-tabs/gjalepackokkccnpnmpjeiaapmpemhcd?hl=en>
#### Video Demo: <https://www.youtube.com/watch?v=pmic1NQNv4s>

---

## Keep Tabs
A Chrome extension to be able to save your tabs and windows by clicking a button so you don't have to worry about losing them. Organizes your saved tabs/windows by date saved. Offers the ability to save tabs/windows, and to view, rename, and remove them.

## Why I Made This Extension
I decided to make this after I kept running into a problem when closing a bunch of tabs and later reopening them: the tabs would not reopen because some Chrome extension that I've installed (I'm not sure exactly which one) blocked them from reopening. So I had to email myself all the links in all my windows when I needed to close them for some reason to be able to access them later. 

Another problem I faced was that Chrome's native bookmarking feature doesn't have the functionality to sort bookmarked tabs by date, which was information I wanted to be able to have as a Chrome user (e.g. I wanted to be able to see when I saved a particular site or window). Hence, I decided to create this Chrome extension to save myself the hassle. 

Note: I'm pretty sure that an extension that does this probably already exists out in the real world, but I made my own extension anyways because why not. 

More seriously, though, making this extension helped fulfill a need that I had, and always was a valuable learning experience to "reinvent the wheel" and see what it takes to make a Chrome extension from scratch.

## Files
1. index.html: This file lays out the basic display of the extension. It also defines the layout of the modals and the custom context menu that will be triggered by certain user actions. 
2. index.css: This file adds simple styling to the layout (HTML) of the extension. 
3. index.js: This is the "meat" of this project. In other words, this is where all of the extension's logic is defined. In it, I've written code to handle different events that can be triggered by users (e.g. right clicking on a particular tab or clicking on a certain button). Additionally, this file manipulates the DOM and its elements as needed for proper functioning of the extension (e.g. hiding/displaying modals and context menus, handling user input).
4. manifest.json: This is a simple configuration file which is required for every Chrome extension. It defines which file to display when the extension popup runs (index.html) as well as which file to use for the logo of the extension. Moreover, it declares a few permissions that are needed for the functioning of the extension (i.e. permission to access information about the user's tabs). The file also specifies several png files of different sizes to use as the extension icon in various contexts.