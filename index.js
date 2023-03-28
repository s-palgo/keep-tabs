const saveTabBtn = document.getElementById("save-tab-btn");
const saveWindowBtn = document.getElementById("save-window-btn");
const seeSavedTabsBtn = document.getElementById("see-saved-tabs-btn");
const hideSavedTabsBtn = document.getElementById("hide-saved-tabs-btn");
const seeSavedWindowsBtn = document.getElementById("see-saved-windows-btn");
const hideSavedWindowsBtn = document.getElementById("hide-saved-windows-btn");
const tabAlreadyAddedModal = document.getElementById("tab-already-added-modal");
const tabAlreadyAddedModalInner = document.getElementById("tab-already-added-modal-inner");
const modalCloseBtnTabAlreadySaved = document.getElementById("modal-close-btn-already-added");
const tabsDisplay = document.getElementById("tabs-display");
const customContextMenu = document.getElementById("custom-context-menu");
const customContextMenuOptions = customContextMenu.getElementsByClassName("custom-context-menu-option");
const changeTabTitleModal = document.getElementById("change-tab-title-modal");
const changeTabTitleInput = document.getElementById("change-tab-title-input");
const changeTabTitleSubmitBtn = document.getElementById("change-tab-title-submit-btn");
const cancelTabTitleChangeBtn = document.getElementById("cancel-tab-title-change-btn");

const display = document.getElementById("display");
const windowsDisplay = document.getElementById("windows-display");
const customContextMenuForWindows = document.getElementById("custom-context-menu-for-windows");
const customContextMenuOptionsForWindows = document.getElementsByClassName("custom-context-menu-option-for-windows");
const changeWindowTitleModal = document.getElementById("change-window-title-modal");
const changeWindowTitleSubmitBtn = document.getElementById("change-window-title-submit-btn");
const cancelWindowTitleChangeBtn = document.getElementById("cancel-window-title-change-btn");
const changeWindowTitleInput = document.getElementById("change-window-title-input");
const windowAlreadyAddedModal = document.getElementById("window-already-added-modal");
const modalCloseBtnWindowAlreadySaved = document.getElementById("modal-close-btn-window-already-added");
const windowAlreadyAddedModalInner = document.getElementById("window-already-added-modal-inner");



let showingSavedTabs = true; // if this is true, then render saved tabs, else render saved windows

// This array will keep track of all saved tabs. 
let savedTabs = [];
let savedWindows = [];

// Checking to see if localStorage already has saved tabs or not.
// If it does, then we save those tabs in the local savedTabs array.
const savedTabsFromLocalStorage = JSON.parse(localStorage.getItem("savedTabs"));
if (savedTabsFromLocalStorage) {
    savedTabs = savedTabsFromLocalStorage;
}

const savedWindowsFromLocalStorage = JSON.parse(localStorage.getItem("savedWindows"));
if (savedWindowsFromLocalStorage) {
    savedWindows = savedWindowsFromLocalStorage;
}

saveTabBtn.addEventListener("click", saveTab);

function saveTab() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        
        if (tabAlreadySaved(currentTab)) {
            // Notify user that tab is already saved by displaying modal
            let indexOfCurrentTab = getIndexOfTabInSavedTabs(currentTab);

            tabAlreadyAddedModalInner.innerHTML = `
                <h2>
                    You've already saved this tab on ${savedTabs[indexOfCurrentTab]["monthSaved"]}/${savedTabs[indexOfCurrentTab]["dateSaved"]}/${savedTabs[indexOfCurrentTab]["yearSaved"]} under the title of <span style='color: red'>${savedTabs[indexOfCurrentTab]["title"]}</span>!
                </h2>
            `;

            tabAlreadyAddedModal.style.display = "block";
        } else {
            // Add tab to savedTabs array
            addTabToSavedTabs(currentTab);

            // Sort savedTabs by date saved (most recently added tabs come first)
            savedTabs.sort(compareByDateSaved);

            // Set savedTabs key in localStorage to the updated value of the local savedTabs array
            localStorage.setItem("savedTabs", JSON.stringify(savedTabs));

            // Show updated saved tabs list on page
            refreshSavedTabsDisplay();
            
        }
    });
}

function refreshSavedTabsDisplay() {
    hideSavedTabs();
    showSavedTabs();
}

seeSavedTabsBtn.addEventListener("click", showSavedTabs);

hideSavedTabsBtn.addEventListener("click", hideSavedTabs);

function hideSavedTabs() {
    removeEventListenersFromSavedTabs();

    tabsDisplay.innerHTML = "";
}

modalCloseBtnTabAlreadySaved.addEventListener("click", function() {
    tabAlreadyAddedModal.style.display = "none";
});

function addTabToSavedTabs(tab) {
    const tabUrl = tab.url;
    const tabOriginalTitle = tab.title;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDate = now.getDate();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSeconds = now.getSeconds();

    let savedTab = {};

    savedTab["url"] = tabUrl;
    savedTab["originalTitle"] = tabOriginalTitle;
    savedTab["title"] = savedTab["originalTitle"]; // title can be changed by user
    savedTab["yearSaved"] = currentYear;
    savedTab["monthSaved"] = currentMonth;
    savedTab["dateSaved"] = currentDate;
    savedTab["hourSaved"] = currentHour;
    savedTab["minuteSaved"] = currentMinute;
    savedTab["secondSaved"] = currentSeconds;

    savedTabs.push(savedTab);
}

function getIndexOfTabInSavedTabs(tab) {
    for (let i = 0; i < savedTabs.length; i++) {
        if (savedTabs[i]["url"] === tab.url) {
            return i;
        }
    }

    return -1; // if not found
}

function tabAlreadySaved(tab) {
    for (let i = 0; i < savedTabs.length; i++) {
        if (savedTabs[i]["url"] === tab.url) {
            return true;
        }
    } 

    return false;
}

function showSavedTabs() {
    showingSavedTabs = true;

    hideSavedWindows();

    renderSavedTabs();

    addEventListenersToSavedTabs();
}

function renderSavedTabs() {
    tabsDisplay.innerHTML = "";
    
    let uniqueDates = findUniqueDates(savedTabs);
    let uniqueDatesToDisplay = makeDatesDisplayFriendly(uniqueDates);

    let allTabs = "";
    
    let uniqueDatesHaveBeenDisplayed = [];
    for (let i = 0; i < uniqueDates.length; i++) {
        uniqueDatesHaveBeenDisplayed.push(false);
    }
    let uniqueDateIndex = 0;

    for (let i = 0; i < savedTabs.length; i++) {        
        let dateTabWasAddedStr = savedTabs[i]["monthSaved"] + "/" + savedTabs[i]["dateSaved"] + "/" + savedTabs[i]["yearSaved"];

        // Adding header with new/next date, if applicable.
        if ((uniqueDates[uniqueDateIndex] === dateTabWasAddedStr) && (uniqueDatesHaveBeenDisplayed[uniqueDateIndex] === false)) {
            allTabs += `
                <h2>${uniqueDatesToDisplay[uniqueDateIndex]}</h2>
            `;

            uniqueDatesHaveBeenDisplayed[uniqueDateIndex] = true;

            if (uniqueDateIndex < (uniqueDates.length - 1)) {
                uniqueDateIndex++;
            }
        }

        allTabs += `
            <p class='tabs' id='${i}-tab'>
                <a href='${savedTabs[i]["url"]}' target='_blank' id='${i}-tab-link'>
                    ${savedTabs[i]["title"]}
                </a>
            </p>
        `;
    }

    tabsDisplay.innerHTML += allTabs;
}

// Every time saved tabs are displayed, event listeners will be 
// added to each tab. The listeners will listen for a "contextmenu"
// event. If the event happens (i.e. if the user right-clicks a 
// tab in order to see its context menu), the context menu will be 
// displayed.
function addEventListenersToSavedTabs() {
    const allTabsByClassName = tabsDisplay.getElementsByClassName("tabs");

    for (let i = 0; i < allTabsByClassName.length; i++) {
        console.log("Added an event listener");
        allTabsByClassName[i].addEventListener("contextmenu", displayCustomContextMenu);
    }
}

// Every time the display of saved tabs is removed (even if temporarily),
// the event listeners from the tabs are removed as well. 
function removeEventListenersFromSavedTabs() {
    const allTabsByClassName = tabsDisplay.getElementsByClassName("tabs");

    for (let i = 0; i < allTabsByClassName.length; i++) {
        console.log("Removed an event listener");
        allTabsByClassName[i].removeEventListener("contextmenu", displayCustomContextMenu);
    }
}

function displayCustomContextMenu(e) {
    e.preventDefault();

    let tabElementThatTriggeredEvent = e.target; // one of the displayed tabs

    let idOfElementThatTriggeredEvent = tabElementThatTriggeredEvent.id;
    let tabIndexInSavedTabs = parseInt(idOfElementThatTriggeredEvent);
    
    // Clear context menu before displaying
    customContextMenu.style.display = "none";

    // Display custom context menu
    customContextMenu.style.display = "block";


    // Finding correct left and top values to position context menu. 
    let mouseXCoordinate = e.clientX;
    let mouseYCoordinate = e.clientY;
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let contextMenuWidth = customContextMenu.clientWidth;
    let contextMenuHeight = customContextMenu.clientHeight;
    
    if ((mouseXCoordinate + contextMenuWidth) > windowWidth) {
        if ((mouseXCoordinate - contextMenuWidth) >= 0) {
            customContextMenu.style.left = (mouseXCoordinate - contextMenuWidth) + "px";
        } else {
            customContextMenu.style.left = "0px";
        }
    } else {
        customContextMenu.style.left = mouseXCoordinate + "px";
    }

    if ((mouseYCoordinate + contextMenuHeight) > windowHeight) {
        if ((mouseYCoordinate - contextMenuHeight) >= 0) {
            customContextMenu.style.top = (mouseYCoordinate - contextMenuHeight) + "px";
        } else {
            customContextMenu.style.left = "0px";
        }    
    } else {
        customContextMenu.style.top = mouseYCoordinate + "px";
    }   

    // Add event listeners here for each of the buttons in the context menu
    const customContextMenuFirstOption = customContextMenuOptions[0];
    customContextMenuFirstOption.id = tabIndexInSavedTabs + "-open-in-new-tab";
    
    const customContextMenuSecondOption = customContextMenuOptions[1];
    customContextMenuSecondOption.id = tabIndexInSavedTabs + "-open-in-new-window";

    const customContextMenuThirdOption = customContextMenuOptions[2];
    customContextMenuThirdOption.id = tabIndexInSavedTabs + "-rename-title";
    
    const customContextMenuFourthOption = customContextMenuOptions[3];
    customContextMenuFourthOption.id = tabIndexInSavedTabs + "-revert-title-to-original";
    
    const customContextMenuFifthOption = customContextMenuOptions[4];
    customContextMenuFifthOption.id = tabIndexInSavedTabs + "-remove-from-saved-tabs";
    
    addEventListenersToAllMenuOptions();

    // Hide context menu if user clicks somewhere on the page outside of menu
    document.addEventListener("click", hideCustomContextMenu);
}

function addEventListenersToAllMenuOptions() {
    const customContextMenuFirstOption = customContextMenuOptions[0];
    const customContextMenuSecondOption = customContextMenuOptions[1];
    const customContextMenuThirdOption = customContextMenuOptions[2];
    const customContextMenuFourthOption = customContextMenuOptions[3];
    const customContextMenuFifthOption = customContextMenuOptions[4];
 
    customContextMenuFirstOption.addEventListener("click", openLinkInNewTab);
    customContextMenuSecondOption.addEventListener("click", openLinkInNewWindow);
    customContextMenuThirdOption.addEventListener("click", renameTab);
    customContextMenuFourthOption.addEventListener("click", revertTitleToOriginal);
    customContextMenuFifthOption.addEventListener("click", removeTabFromSavedTabs);
}

function removeEventListenersFromAllMenuOptions() {
    const customContextMenuFirstOption = customContextMenuOptions[0];
    const customContextMenuSecondOption = customContextMenuOptions[1];
    const customContextMenuThirdOption = customContextMenuOptions[2];
    const customContextMenuFourthOption = customContextMenuOptions[3];
    const customContextMenuFifthOption = customContextMenuOptions[4];
 
    customContextMenuFirstOption.removeEventListener("click", openLinkInNewTab);
    customContextMenuSecondOption.removeEventListener("click", openLinkInNewWindow);
    customContextMenuThirdOption.removeEventListener("click", renameTab);
    customContextMenuFourthOption.removeEventListener("click", revertTitleToOriginal);
    customContextMenuFifthOption.removeEventListener("click", removeTabFromSavedTabs);
}

function hideCustomContextMenu() {
    removeEventListenersFromAllMenuOptions();
    customContextMenu.style.display = "none";
}

function openLinkInNewTab(e) {
    const elementThatTriggeredEvent = e.target; // customContextMenuFirstOption
    let idOfElementThatTriggeredEvent = elementThatTriggeredEvent.id;
    let tabIndexInSavedTabs = parseInt(idOfElementThatTriggeredEvent);
    
    hideCustomContextMenu();
    
    window.open(savedTabs[tabIndexInSavedTabs]["url"], "_blank");
}

function openLinkInNewWindow(e) {
    const elementThatTriggeredEvent = e.target; // customContextMenuSecondOption
    let idOfElementThatTriggeredEvent = elementThatTriggeredEvent.id;
    let tabIndexInSavedTabs = parseInt(idOfElementThatTriggeredEvent);
    hideCustomContextMenu();
    
    chrome.windows.create({
        url: savedTabs[tabIndexInSavedTabs]["url"]
    });
}

function renameTab(e) {
    const elementThatTriggeredEvent = e.target; // customContextMenuThirdOption
    let idOfElementThatTriggeredEvent = elementThatTriggeredEvent.id;
    
    changeTabTitleSubmitBtn.id = idOfElementThatTriggeredEvent + "-btn";

    changeTabTitleModal.style.display = "block";
    changeTabTitleInput.focus();

    hideCustomContextMenu();

    changeTabTitleSubmitBtn.addEventListener("click", captureAndSaveNewTabTitle);

    cancelTabTitleChangeBtn.addEventListener("click", cancelTabTitleChange);
}

function cancelTabTitleChange() {
    changeTabTitleSubmitBtn.removeEventListener("click", captureAndSaveNewTabTitle);
    changeTabTitleInput.value = "";
    changeTabTitleModal.style.display = "none";

    cancelTabTitleChangeBtn.removeEventListener("click", cancelTabTitleChange);
}

function captureAndSaveNewTabTitle(e) {
    const elementThatTriggeredEvent = e.target; // changeTabTitleSubmitBtn

    console.log(elementThatTriggeredEvent);
    
    let idOfElementThatTriggeredEvent = elementThatTriggeredEvent.id;

    let tabIndexInSavedTabs = parseInt(idOfElementThatTriggeredEvent);

    const newTitle = changeTabTitleInput.value;

    // If user clicked the "submit" button without entering anything, 
    // abort the entire tab-title-changing process by cancelling the change.
    if (newTitle.trim().length === 0) {
        cancelTabTitleChange();
        return;
    }

    changeTabTitleInput.value = "";
    changeTabTitleModal.style.display = "none";
    
    savedTabs[tabIndexInSavedTabs]["title"] = newTitle;
    localStorage.setItem("savedTabs", JSON.stringify(savedTabs));

    refreshSavedTabsDisplay();

    changeTabTitleSubmitBtn.removeEventListener("click", captureAndSaveNewTabTitle);
    cancelTabTitleChangeBtn.removeEventListener("click", cancelTabTitleChange);
}

function revertTitleToOriginal(e) {
    const elementThatTriggeredEvent = e.target; // customContextMenuFourthOption

    let idOfElementThatTriggeredEvent = elementThatTriggeredEvent.id;

    let tabIndexInSavedTabs = parseInt(idOfElementThatTriggeredEvent);

    savedTabs[tabIndexInSavedTabs]["title"] = savedTabs[tabIndexInSavedTabs]["originalTitle"];
    localStorage.setItem("savedTabs", JSON.stringify(savedTabs));
    
    refreshSavedTabsDisplay();
    
    hideCustomContextMenu();
}

function removeTabFromSavedTabs(e) {
    const elementThatTriggeredEvent = e.target; // customContextMenuFifthOption
    let idOfElementThatTriggeredEvent = elementThatTriggeredEvent.id;
    let tabIndexInSavedTabs = parseInt(idOfElementThatTriggeredEvent);

    removeEventListenersFromSavedTabs();

    // Remove tab at tabIndexInSavedTabs from savedTabs array
    savedTabs.splice(tabIndexInSavedTabs, 1);
    localStorage.setItem("savedTabs", JSON.stringify(savedTabs));

    showSavedTabs();

    hideCustomContextMenu();
}

saveWindowBtn.addEventListener("click", saveWindow);

function saveWindow() {
    chrome.windows.getCurrent({"populate": true}, function(currentWindow) {
        if (windowAlreadySaved(currentWindow)) {
            let indexOfCurrentWindow = getIndexOfWindowInSavedWindows(currentWindow);
            
            // TODO: Notify the user that a window with same tabs in same order has already been saved
            // TODO: Include a note about when the window was previously saved and the title of the window
            // console.log(`You've already added this window on ${savedWindows[indexOfCurrentWindow]["monthSaved"]}/${savedWindows[indexOfCurrentWindow]["dateSaved"]}/${savedWindows[indexOfCurrentWindow]["yearSaved"]}!`);

            windowAlreadyAddedModalInner.innerHTML = `
                <h2>
                    You've already saved this window on ${savedWindows[indexOfCurrentWindow]["monthSaved"]}/${savedWindows[indexOfCurrentWindow]["dateSaved"]}/${savedWindows[indexOfCurrentWindow]["yearSaved"]} under the title of <span style='color: red'>${savedWindows[indexOfCurrentWindow]["title"]}</span>!
                </h2>
            `;

            windowAlreadyAddedModal.style.display = "block";

        } else {
            addWindowToSavedWindows(currentWindow);

            // Sort savedWindows by date saved (most recently added windows come first)
            savedWindows.sort(compareByDateSaved);

            // Set savedWindows key in localStorage to the updated value of the local savedWindows array
            localStorage.setItem("savedWindows", JSON.stringify(savedWindows));
            
            // TODO: Show updated windows list on page
            refreshSavedWindowsDisplay();
        }
    });
}

modalCloseBtnWindowAlreadySaved.addEventListener("click", function() {
    windowAlreadyAddedModal.style.display = "none";
});

seeSavedWindowsBtn.addEventListener("click", showSavedWindows);

function addWindowToSavedWindows(window) {
    let tabsInWindow = window.tabs;

    let arrOfTabs = [];

    for (let i = 0; i < tabsInWindow.length; i++) {
        let tab = {};
        tab["title"] = tabsInWindow[i]["title"];
        tab["url"] = tabsInWindow[i]["url"];

        arrOfTabs.push(tab);
    }
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDate = now.getDate();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSeconds = now.getSeconds();

    let savedWindow = {};

    savedWindow["tabs"] = arrOfTabs;
    savedWindow["originalTitle"] = generateOriginalTitleForWindow(window);
    savedWindow["title"] = savedWindow["originalTitle"];
    savedWindow["yearSaved"] = currentYear;
    savedWindow["monthSaved"] = currentMonth;
    savedWindow["dateSaved"] = currentDate;
    savedWindow["hourSaved"] = currentHour;
    savedWindow["minuteSaved"] = currentMinute;
    savedWindow["secondSaved"] = currentSeconds;

    savedWindows.push(savedWindow);
}

function generateOriginalTitleForWindow(window) {   
    const tabsInCurrentWindow = window.tabs;
    const numOfTabsInWindow = tabsInCurrentWindow.length;
    
    const originalTitle = `"${tabsInCurrentWindow[0]["title"]}" + ${numOfTabsInWindow - 1} more tabs`;

    return originalTitle;
}


function getIndexOfWindowInSavedWindows(window) {
    const tabsInWindow = window.tabs;
    let windowTabUrls = [];
    for (let i = 0; i < tabsInWindow.length; i++) {
        windowTabUrls.push(tabsInWindow[i]["url"]);
    }

    for (let i = 0; i < savedWindows.length; i++) {
        const windowTabUrlsCopy = JSON.parse(JSON.stringify(windowTabUrls));
        windowTabUrlsCopy.sort(); // sort window tab URLs alphabetically

        const currentSavedWindow = savedWindows[i];
        const currentSavedWindowTabs = currentSavedWindow["tabs"];

        let currentSavedWindowTabUrls = [];

        for (let j = 0; j < currentSavedWindowTabs.length; j++) {
            currentSavedWindowTabUrls.push(currentSavedWindowTabs[j]["url"]);
        }
        
        currentSavedWindowTabUrls.sort(); // sort current savedWindow tab URLs alphabetically
        
        if (windowTabUrlsCopy.length === currentSavedWindowTabUrls.length) {
            if (JSON.stringify(windowTabUrlsCopy) === JSON.stringify(currentSavedWindowTabUrls)) {
                return i;
            }
        }
    }

    return -1;
    



    // const tabsInWindow = window.tabs;
        
    // for (let i = 0; i < savedWindows.length; i++) {
    //     let currentSavedWindow = savedWindows[i];
    //     let currentSavedWindowIsSameAsParameterWindow = true;

    //     if (currentSavedWindow["tabs"].length !== tabsInWindow.length) {
    //         continue;
    //     } else {
    //         for (let j = 0; j < tabsInWindow.length; j++) {
    //             if (currentSavedWindow["tabs"][j]["url"] !== tabsInWindow[j]["url"]) {
    //                 currentSavedWindowIsSameAsParameterWindow = false;
    //                 break;
    //             }
    //         }

    //         if (currentSavedWindowIsSameAsParameterWindow) {
    //             return i;
    //         }
    //     }
    // }

    // return -1;
    











    // if (!windowAlreadySaved(window)) {
    //     return -1;
    // } else {
        
    // }
}

// NOTE FOR TOMORROW: CHANGE THIS METHOD SO 
// THAT TWO WINDOWS WITH THE SAME TABS ARE 
// TREATED AS THE SAME, EVEN IF THE TABS ARE 
// IN DIFFERENT ORDER

// ALSO CHANGE THE GETINDEXOFWINDOWINSAVED() METHOD IF NEEDED

// this method treats windows with the same tabs open as "already saved"
// e.g. if I saved a window with 8 tabs, then I opened another window with the same 8 urls, those would be considered the same windows
function windowAlreadySaved(window) {
    const tabsInWindow = window.tabs;
    let windowTabUrls = [];
    for (let i = 0; i < tabsInWindow.length; i++) {
        windowTabUrls.push(tabsInWindow[i]["url"]);
    }

    for (let i = 0; i < savedWindows.length; i++) {
        const windowTabUrlsCopy = JSON.parse(JSON.stringify(windowTabUrls));
        windowTabUrlsCopy.sort(); // sort window tab URLs alphabetically

        const currentSavedWindow = savedWindows[i];
        const currentSavedWindowTabs = currentSavedWindow["tabs"];

        let currentSavedWindowTabUrls = [];

        for (let j = 0; j < currentSavedWindowTabs.length; j++) {
            currentSavedWindowTabUrls.push(currentSavedWindowTabs[j]["url"]);
        }
        
        currentSavedWindowTabUrls.sort(); // sort current savedWindow tab URLs alphabetically
        
        if (windowTabUrlsCopy.length === currentSavedWindowTabUrls.length) {
            if (JSON.stringify(windowTabUrlsCopy) === JSON.stringify(currentSavedWindowTabUrls)) {
                return true;
            }
        }
    }

    return false;
    
    // const tabsInWindow = window.tabs;
    
    // for (let i = 0; i < savedWindows.length; i++) {
    //     let currentSavedWindow = savedWindows[i];
    //     let currentSavedWindowIsSameAsParameterWindow = true;

    //     if (currentSavedWindow["tabs"].length !== tabsInWindow.length) {
    //         continue;
    //     } else {
    //         for (let j = 0; j < tabsInWindow.length; j++) {
    //             if (currentSavedWindow["tabs"][j]["url"] !== tabsInWindow[j]["url"]) {
    //                 currentSavedWindowIsSameAsParameterWindow = false;
    //                 break;
    //             }
    //         }
            
    //         if (currentSavedWindowIsSameAsParameterWindow) {
    //             return true;
    //         }
    //     }
    // }

    // return false;


















    // for (let i = 0; i < savedWindows.length; i++) {
        
    
        
    //     let currentSavedWindow = savedWindows[i];
    //     if (tabsInWindow.length === currentSavedWindow["tabs"].length) {
    //         for (let j = 0; j < tabsInWindow.length; j++) {
    //             if (tabsInWindow[j]["url"] !== currentSavedWindow["tabs"][j]["url"]) {
    //                 return false;
    //             }
    //         }
    //         // Reaching this point means that the parameter window and savedWindows[i] have the same tabs in the same order
    //         return true;
    //     }
    // }
    // // Reaching this point means that no window in savedWindows had the same tabs in the same order
    // return false;
}

function showSavedWindows() {    
    hideSavedTabs();
    
    renderSavedWindows();

    addEventListenersToSavedWindows();
}

function addEventListenersToSavedWindows() {
    const allWindowsByClassName = windowsDisplay.getElementsByClassName("windows");

    for (let i = 0; i < allWindowsByClassName.length; i++) {
        console.log("Added an event listener");
        allWindowsByClassName[i].addEventListener("contextmenu", displayCustomContextMenuForWindows);
        allWindowsByClassName[i].addEventListener("click", openAllTabsInNewWindow);
    }
}

function removeEventListenersFromSavedWindows() {
    const allWindowsByClassName = windowsDisplay.getElementsByClassName("windows");

    for (let i = 0; i < allWindowsByClassName.length; i++) {
        console.log("Added an event listener");
        allWindowsByClassName[i].removeEventListener("contextmenu", displayCustomContextMenuForWindows);
        allWindowsByClassName[i].removeEventListener("click", openAllTabsInNewWindow);
    }
}

function displayCustomContextMenuForWindows(e) {
    e.preventDefault();

    let windowElementThatTriggeredEvent = e.target; // one of the displayed windows

    let idOfElementThatTriggeredEvent = windowElementThatTriggeredEvent.id;
    let windowIndexInSavedWindows = parseInt(idOfElementThatTriggeredEvent);
    
    // Clear context menu before displaying
    customContextMenuForWindows.style.display = "none";

    // Display custom context menu
    customContextMenuForWindows.style.display = "block";


    // Finding correct left and top values to position context menu. 
    let mouseXCoordinate = e.clientX;
    let mouseYCoordinate = e.clientY;
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let contextMenuWidth = customContextMenuForWindows.clientWidth;
    let contextMenuHeight = customContextMenuForWindows.clientHeight;
    
    if ((mouseXCoordinate + contextMenuWidth) > windowWidth) {
        if ((mouseXCoordinate - contextMenuWidth) >= 0) {
            customContextMenuForWindows.style.left = (mouseXCoordinate - contextMenuWidth) + "px";
        } else {
            customContextMenuForWindows.style.left = "0px";
        }
    } else {
        customContextMenuForWindows.style.left = mouseXCoordinate + "px";
    }

    if ((mouseYCoordinate + contextMenuHeight) > windowHeight) {
        if ((mouseYCoordinate - contextMenuHeight) >= 0) {
            customContextMenuForWindows.style.top = (mouseYCoordinate - contextMenuHeight) + "px";
        } else {
            customContextMenuForWindows.style.left = "0px";
        }    
    } else {
        customContextMenuForWindows.style.top = mouseYCoordinate + "px";
    }

    // Add event listeners here for each of the buttons in the context menu
    const customContextMenuFirstOption = customContextMenuOptionsForWindows[0];
    customContextMenuFirstOption.id = windowIndexInSavedWindows + "-open-all-tabs-in-same-window";
    
    
    
    const customContextMenuSecondOption = customContextMenuOptionsForWindows[1];
    customContextMenuSecondOption.id = windowIndexInSavedWindows + "-see-all-tabs";
    
    let innerHTMLWithoutListOfTabs = `
        ${savedWindows[windowIndexInSavedWindows]["title"]}
    `;
    
    // console.log(savedWindows[windowIndexInSavedWindows]);
    // console.log(windowIndexInSavedWindows);
    // console.log(windowElementThatTriggeredEvent.innerHTML.trim());
    // console.log(innerHTMLWithoutListOfTabs.trim());
    // console.log(windowElementThatTriggeredEvent.innerHTML.trim() === innerHTMLWithoutListOfTabs.trim());

    if (windowElementThatTriggeredEvent.innerHTML.trim() === innerHTMLWithoutListOfTabs.trim()) {
        customContextMenuSecondOption.innerHTML = "See all window tabs";
    } else {
        customContextMenuSecondOption.innerHTML = "Hide tabs in window";
    }



    const customContextMenuThirdOption = customContextMenuOptionsForWindows[2];
    customContextMenuThirdOption.id = windowIndexInSavedWindows + "-rename-window";
    
    const customContextMenuFourthOption = customContextMenuOptionsForWindows[3];
    customContextMenuFourthOption.id = windowIndexInSavedWindows + "-revert-window-title-to-original";
    
    const customContextMenuFifthOption = customContextMenuOptionsForWindows[4];
    customContextMenuFifthOption.id = windowIndexInSavedWindows + "-remove-from-saved-windows";
    
    addEventListenersToAllWindowMenuOptions();

    // Hide context menu if user clicks somewhere on the page outside of menu
    document.addEventListener("click", hideCustomContextMenuForWindows);
}

function openAllTabsInNewWindow(e) {
    const elementThatTriggeredEvent = e.target; // customContextMenuFirstOption
    let idOfElementThatTriggeredEvent = elementThatTriggeredEvent.id;
    let windowIndexInSavedWindows = parseInt(idOfElementThatTriggeredEvent);
    hideCustomContextMenuForWindows();
    
    const windowTabs = savedWindows[windowIndexInSavedWindows]["tabs"];
    let windowTabUrls = [];

    for (let i = 0; i < windowTabs.length; i++) {
        windowTabUrls.push(windowTabs[i]["url"]);
    }

    chrome.windows.create({
        url: windowTabUrls
    });

}

function seeAllTabsInWindow(e) {
    const elementThatTriggeredEvent = e.target; // customContextMenuSecondOption
    let idOfElementThatTriggeredEvent = elementThatTriggeredEvent.id;
    let windowIndexInSavedWindows = parseInt(idOfElementThatTriggeredEvent);
    
    const windowThatWasClicked = document.getElementById(windowIndexInSavedWindows + "-window");

    if (elementThatTriggeredEvent.innerHTML === "Hide tabs in window") {
        windowThatWasClicked.innerHTML = `
            ${savedWindows[windowIndexInSavedWindows]["title"]}
        `;
        
        elementThatTriggeredEvent.innerHTML = "See all window tabs";
    } else {
        let windowTabs = savedWindows[windowIndexInSavedWindows]["tabs"];

        let listOfTabsInWindow = `<ul id='${windowIndexInSavedWindows}-window-tabs'>`;
        for (let i = 0; i < windowTabs.length; i++) {
            listOfTabsInWindow += `
                <li id='${windowIndexInSavedWindows}-window-tab-${i}'>
                    <a href="${savedWindows[windowIndexInSavedWindows]["tabs"][i]["url"]}" target="_blank">
                        ${savedWindows[windowIndexInSavedWindows]["tabs"][i]["title"]}
                    </a>
                </li>
            `;
        }
        listOfTabsInWindow += `</ul>`;

        windowThatWasClicked.innerHTML += listOfTabsInWindow;

        elementThatTriggeredEvent.innerHTML = "Hide tabs in window";
    }
        
    hideCustomContextMenuForWindows();
}

function renameWindow(e) {
    const elementThatTriggeredEvent = e.target; // customContextMenuThirdOption
    let idOfElementThatTriggeredEvent = elementThatTriggeredEvent.id;
    
    changeWindowTitleSubmitBtn.id = idOfElementThatTriggeredEvent + "-btn";

    changeWindowTitleModal.style.display = "block";
    changeWindowTitleInput.focus();

    hideCustomContextMenuForWindows();

    changeWindowTitleSubmitBtn.addEventListener("click", captureAndSaveNewWindowTitle);

    cancelWindowTitleChangeBtn.addEventListener("click", cancelWindowTitleChange);
}

function captureAndSaveNewWindowTitle(e) {
    const elementThatTriggeredEvent = e.target; // changeWindowTitleSubmitBtn
    // console.log(elementThatTriggeredEvent);
    let idOfElementThatTriggeredEvent = elementThatTriggeredEvent.id;
    let windowIndexInSavedWindows = parseInt(idOfElementThatTriggeredEvent);

    const newTitle = changeWindowTitleInput.value;

    // If user clicked the "submit" button without entering anything, 
    // abort the entire window-title-changing process by cancelling the change.
    if (newTitle.trim().length === 0) {
        cancelWindowTitleChange();
        return;
    }

    changeWindowTitleInput.value = "";
    changeWindowTitleModal.style.display = "none";
    
    savedWindows[windowIndexInSavedWindows]["title"] = newTitle;
    localStorage.setItem("savedWindows", JSON.stringify(savedWindows));

    refreshSavedWindowsDisplay();

    changeWindowTitleSubmitBtn.removeEventListener("click", captureAndSaveNewWindowTitle);
    cancelWindowTitleChangeBtn.removeEventListener("click", cancelWindowTitleChange);
}

function cancelWindowTitleChange() {
    changeWindowTitleSubmitBtn.removeEventListener("click", captureAndSaveNewWindowTitle);
    changeWindowTitleInput.value = "";
    changeWindowTitleModal.style.display = "none";

    cancelWindowTitleChangeBtn.removeEventListener("click", cancelWindowTitleChange);
}

function revertWindowTitleToOriginal(e) {
    const elementThatTriggeredEvent = e.target; // customContextMenuFourthOption
    let idOfElementThatTriggeredEvent = elementThatTriggeredEvent.id;
    let windowIndexInSavedWindows = parseInt(idOfElementThatTriggeredEvent);

    savedWindows[windowIndexInSavedWindows]["title"] = savedWindows[windowIndexInSavedWindows]["originalTitle"];
    localStorage.setItem("savedWindows", JSON.stringify(savedWindows));
    
    refreshSavedWindowsDisplay();
    
    hideCustomContextMenuForWindows();
}

function removeWindowFromSavedWindows(e) {
    const elementThatTriggeredEvent = e.target; // customContextMenuFifthOption
    let idOfElementThatTriggeredEvent = elementThatTriggeredEvent.id;
    let windowIndexInSavedWindows = parseInt(idOfElementThatTriggeredEvent);

    removeEventListenersFromSavedWindows();

    // Remove window at windowIndexInSavedWindows from savedWindows array
    savedWindows.splice(windowIndexInSavedWindows, 1);
    localStorage.setItem("savedWindows", JSON.stringify(savedWindows));

    showSavedWindows();

    hideCustomContextMenuForWindows();
}

function refreshSavedWindowsDisplay() {
    hideSavedWindows();
    showSavedWindows();
}

function hideSavedWindows() {
    removeEventListenersFromSavedWindows();

    windowsDisplay.innerHTML = "";
}

hideSavedWindowsBtn.addEventListener("click", hideSavedWindows);

function addEventListenersToAllWindowMenuOptions() {    
    const customContextMenuFirstOption = customContextMenuOptionsForWindows[0];
    const customContextMenuSecondOption = customContextMenuOptionsForWindows[1];
    const customContextMenuThirdOption = customContextMenuOptionsForWindows[2];
    const customContextMenuFourthOption = customContextMenuOptionsForWindows[3];
    const customContextMenuFifthOption = customContextMenuOptionsForWindows[4];
 
    customContextMenuFirstOption.addEventListener("click", openAllTabsInNewWindow);
    customContextMenuSecondOption.addEventListener("click", seeAllTabsInWindow);
    customContextMenuThirdOption.addEventListener("click", renameWindow);
    customContextMenuFourthOption.addEventListener("click", revertWindowTitleToOriginal);
    customContextMenuFifthOption.addEventListener("click", removeWindowFromSavedWindows);
}

function hideCustomContextMenuForWindows() {
    removeEventListenersFromAllWindowMenuOptions();
    customContextMenuForWindows.style.display = "none";
}

function removeEventListenersFromAllWindowMenuOptions() {
    const customContextMenuFirstOption = customContextMenuOptionsForWindows[0];
    const customContextMenuSecondOption = customContextMenuOptionsForWindows[1];
    const customContextMenuThirdOption = customContextMenuOptionsForWindows[2];
    const customContextMenuFourthOption = customContextMenuOptionsForWindows[3];
    const customContextMenuFifthOption = customContextMenuOptionsForWindows[4];
 
    customContextMenuFirstOption.removeEventListener("click", openAllTabsInNewWindow);
    customContextMenuSecondOption.removeEventListener("click", seeAllTabsInWindow);
    customContextMenuThirdOption.removeEventListener("click", renameWindow);
    customContextMenuFourthOption.removeEventListener("click", revertWindowTitleToOriginal);
    customContextMenuFifthOption.removeEventListener("click", removeWindowFromSavedWindows);
}

function renderSavedWindows() {
    windowsDisplay.innerHTML = "";

    let uniqueDates = findUniqueDates(savedWindows);
    let uniqueDatesToDisplay = makeDatesDisplayFriendly(uniqueDates);

    let allWindows = "";
    
    let uniqueDatesHaveBeenDisplayed = [];
    for (let i = 0; i < uniqueDates.length; i++) {
        uniqueDatesHaveBeenDisplayed.push(false);
    }
    let uniqueDateIndex = 0;

    for (let i = 0; i < savedWindows.length; i++) {        
        let dateWindowWasAddedStr = savedWindows[i]["monthSaved"] + "/" + savedWindows[i]["dateSaved"] + "/" + savedWindows[i]["yearSaved"];

        // Adding header with new/next date, if applicable.
        if ((uniqueDates[uniqueDateIndex] === dateWindowWasAddedStr) && (uniqueDatesHaveBeenDisplayed[uniqueDateIndex] === false)) {
            allWindows += `
                <h2>${uniqueDatesToDisplay[uniqueDateIndex]}</h2>
            `;

            uniqueDatesHaveBeenDisplayed[uniqueDateIndex] = true;

            if (uniqueDateIndex < (uniqueDates.length - 1)) {
                uniqueDateIndex++;
            }
        }

        allWindows += `
            <div class='windows' id='${i}-window'>
                ${savedWindows[i]["title"]}
            </div>
        `;
    }

    windowsDisplay.innerHTML += allWindows;
}

// Useful function to sort an array of tabs/windows from most recent to least recent in terms of when they were saved.
// Returns negative number if first tab/window was more recently saved than second tab/window.
// Returns positive number if first tab/window was less recently saved than second tab/window.
// Returns 0 if first tab/window and second tab/window were saved at the same time.
function compareByDateSaved(element1, element2) {
    if (element1["yearSaved"] !== element2["yearSaved"]) {
        return -1 * (element1["yearSaved"] - element2["yearSaved"]);
    } else if (element1["monthSaved"] !== element2["monthSaved"]) {
        return -1 * (element1["monthSaved"] - element2["monthSaved"]);
    } else if (element1["dateSaved"] !== element2["dateSaved"]) {
        return -1 * (element1["dateSaved"] - element2["dateSaved"]);
    } else if (element1["hourSaved"] !== element2["hourSaved"]) {
        return -1 * (element1["hourSaved"] - element2["hourSaved"]);
    } else if (element1["minuteSaved"] !== element2["minuteSaved"]) {
        return -1 * (element1["minuteSaved"] - element2["minuteSaved"]);
    } else if (element1["secondSaved"] !== element2["secondSaved"]) {
        return -1 * (element1["secondSaved"] - element2["secondSaved"]);
    } else {
        return 0;
    }
}

function findUniqueDates(arr) {
    let arrOfUniqueDates = [];

    if (arr.length === 0) {
        return arrOfUniqueDates;
    } else {
        let firstElementYearSaved = arr[0]["yearSaved"];
        let firstElementMonthSaved = arr[0]["monthSaved"];
        let firstElementDateSaved = arr[0]["dateSaved"];
        
        let firstElementDate = firstElementMonthSaved + "/" + firstElementDateSaved + "/" + firstElementYearSaved;
        arrOfUniqueDates.push(firstElementDate);

        for (let i = 1; i < arr.length; i++) {
            let elemYearSaved = arr[i]["yearSaved"];
            let elemMonthSaved = arr[i]["monthSaved"];
            let elemDateSaved = arr[i]["dateSaved"];

            let elemDate = elemMonthSaved + "/" + elemDateSaved + "/" + elemYearSaved;

            let elemDateIsUnique = true;

            for (let j = 0; j < arrOfUniqueDates.length; j++) {
                if (elemDate === arrOfUniqueDates[j]) {
                    elemDateIsUnique = false;
                    break;
                }
            }

            if (elemDateIsUnique) {
                arrOfUniqueDates.push(elemDate);
            }
        }
        return arrOfUniqueDates;
    }
}

// Function which turns dates into human-friendly strings.
// For example, if a date in the array matches today's date, the date will be turned into "Today".
// If a date matches yesterday's date, the date will be turned into "Yesterday".
// Otherwise, the date will be turned into a string with the name of the month, followed by the date and year.
// E.g. 3/18/2021 will be turned into "March 18th, 2021".
function makeDatesDisplayFriendly(dates) {
    // creating deep copy of dates
    let displayFriendlyDates = JSON.parse(JSON.stringify(dates));
    
    const today = new Date();
    const todaysMonth = today.getMonth() + 1;
    const todaysDate = today.getDate();
    const todaysYear = today.getFullYear();
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdaysMonth = yesterday.getMonth() + 1;
    const yesterdaysDate = yesterday.getDate();
    const yesterdaysYear = yesterday.getFullYear();
    
    const todayStr = todaysMonth + "/" + todaysDate + "/" + todaysYear;
    const yesterdayStr = yesterdaysMonth + "/" + yesterdaysDate + "/" + yesterdaysYear;

    for (let i = 0; i < dates.length; i++) {
        const dateAsArr = dates[i].split("/");
        const monthName = mapNumberToMonth(parseInt(dateAsArr[0]));
        const dateWithSuffix = addSuffixToDate(parseInt(dateAsArr[1]));
        const yearStr = dateAsArr[2];

        const displayFriendlyDate = monthName + " " + dateWithSuffix + ", " + yearStr;

        
        if (dates[i] === todayStr) {
            displayFriendlyDates[i] = "Today (" + displayFriendlyDate + ")";
        } else if (dates[i] === yesterdayStr) {
            displayFriendlyDates[i] = "Yesterday (" + displayFriendlyDate + ")";
        } else {
            displayFriendlyDates[i] = displayFriendlyDate;
        }
    }

    return displayFriendlyDates;
    
}

function mapNumberToMonth(number) {
    if (number === 1) {
        return "January";
    } else if (number === 2) {
        return "February";
    } else if (number === 3) {
        return "March";
    } else if (number === 4) {
        return "April";
    } else if (number === 5) {
        return "May";
    } else if (number === 6) {
        return "June";
    } else if (number === 7) {
        return "July";
    } else if (number === 8) {
        return "August";
    } else if (number === 9) {
        return "September";
    } else if (number === 10) {
        return "October";
    } else if (number === 11) {
        return "November";
    } else if (number === 12) {
        return "December";
    } else {
        return null;
    }
}

// Used to add human-friendly suffix to a number representing a date.
// For example, 23 will be turned into "23rd", 15 into "15th", etc.
function addSuffixToDate(date) {
    if (((date % 10) > 3) || ((date % 10) === 0)) {
        return (date + "th");
    } else if ((date % 10) === 1) {
        if (Math.floor(date / 10) === 1) {
            return (date + "th");
        } else {
            return (date + "st");
        }
    } else if ((date % 10) === 2) {
        if (Math.floor(date / 10) === 1) {
            return (date + "th");
        } else {
            return (date + "nd");
        }
    } else if ((date % 10) === 3) {
        if (Math.floor(date / 10) === 1) {
            return (date + "th");
        } else {
            return (date + "rd");
        }
    }
}