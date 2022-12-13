const setUp = async () => {
    const button1 = document.getElementById("button1");
    const button2 = document.getElementById("button2");

    // オプションでストレージに設定した値をボタンのテキストに設定する。
    chrome.storage.local.get(null, (options) => {
        button1.innerText = options.button1;
        button2.innerText = options.button2;
    });

    button1.addEventListener("click", clickEventHandler);
    button2.addEventListener("click", clickEventHandler);

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    const hasInputComponent = () => {
        return document.querySelector("div.ql-editor > p") != null
            && document.querySelector("button.c-wysiwyg_container__button--send") != null;
    }

    chrome.scripting.executeScript({
        target: {
            tabId: tab.id
        },
        func: hasInputComponent
    }).then((r) => {
        // 入力エディタがない場合は押せても意味がないのでボタンを非活性にする。
        const ret = r[0].result;
        button1.disabled = !ret;
        button2.disabled = !ret;
    });
}

const clickEventHandler = async (e) => {

    // クリックしたボタンのテキストをメッセージとして送信するために、ストレージに設定する。
    chrome.storage.local.set({
        slackMessage: e.target.innerText
    });

    const onRun = () => {
        const sendButton = document.querySelector("button.c-wysiwyg_container__button--send");
        const isDisabled = () => {
            return Array.from(sendButton.classList).includes("c-wysiwyg_container__button--disabled")
        }

        // 送信ボタンが非活性ではなくなったら送信ボタンを押下する。
        const mutationObserver = new MutationObserver((mutationsList, observer) => {
            mutationsList.forEach(mutation => {
                if (mutation.attributeName === 'class' && !isDisabled()) {
                    sendButton.click();
                    mutationObserver.disconnect();
                }
            })
        })
        mutationObserver.observe(sendButton, { attributes: true });


        chrome.storage.local.get(null, (options) => {
            document.querySelector("div.ql-editor > p").innerText = options["slackMessage"];

            // 使用後はストレージから削除する。
            chrome.storage.local.remove("slackMessage");
        });
    }

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    chrome.scripting.executeScript({
        target: {
            tabId: tab.id
        },
        function: onRun
    });
}

setUp();
