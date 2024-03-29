'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const chooseBox = $make.qs('.choose');

    const form = $make.qsf('.choose_form', chooseBox);
    const bookmark = $make.qsf('.choose_bookmark a', chooseBox);

    const video = $make.qs('.video');

    const controls = $make.qs('.controls');
    const controlsClose = $make.qsf('.controls__close', controls);
    const controlsReload = $make.qsf('.controls__reload', controls);
    const controlsNext = $make.qsf('.controls__next', controls);

    const appDataInit = {
        threadData: {},
        videos: [],
        previousVideo: null,
        proxy: 'https://cors-anywhere.herokuapp.com/',
    };

    let appData = { ...appDataInit };

    const inputs = $make.qs('input, button', ['a']);

    const inputsAction = action => {
        inputs.forEach(input => {
            switch (action) {
                case 'block':
                    input.disabled = true;
                    break;
                case 'unlock':
                    input.disabled = false;
                    break;
                default:
            }
        });
    };

    const random = num => Math.floor(Math.random() * num);

    const threadURLData = url => {
        const threadURL = new URL(url);

        const threadURLSplited = threadURL.pathname.split('/');

        return {
            host: threadURL.hostname,
            board: threadURLSplited[1],
            thread_num: threadURLSplited[3].replace('.html', ''),
        };
    };

    const setRandomVideo = () => {
        const { threadData, videos, previousVideo } = appData;

        const nextVideo = videos[random(videos.length - 1)];

        if (nextVideo === previousVideo && videos.length > 1) {
            setRandomVideo();
        }

        video.setAttribute(
            'src',
            'https://' +
                threadData.host +
                '/' +
                threadData.board +
                '/src/' +
                threadData.thread_num +
                '/' +
                nextVideo
        );

        appData.previousVideo = nextVideo;
    };

    const showVideo = () => {
        chooseBox.hidden = true;

        video.hidden = false;
        video.onended = () => setRandomVideo();
        video.onerror = () => setRandomVideo();

        controls.hidden = false;

        setRandomVideo();
    };

    const hideVideo = () => {
        chooseBox.hidden = false;

        video.hidden = true;
        video.onended = () => void 0;
        video.onerror = () => void 0;
        video.src = '';

        controls.hidden = true;
    };

    const APIRequest = () => {
        const { threadData, proxy } = appData;

        inputsAction('block');

        fetch(
            `${proxy}https://${threadData.host}/${threadData.board}/res/${threadData.thread_num}.json`,
            { cache: 'no-store' }
        )
            .then(r => r.json())
            .then(data => {
                const posts = data.threads[0].posts;
                const videos = [];

                posts.forEach(post => {
                    const postFiles = post.files || [];

                    for (let i = 0; i < postFiles.length; i++) {
                        const fileName = postFiles[i].name;

                        if (
                            fileName.endsWith('webm') ||
                            fileName.endsWith('mp4') ||
                            fileName.endsWith('mkv') ||
                            fileName.endsWith('ogv') ||
                            fileName.endsWith('ogg') ||
                            fileName.endsWith('avi') ||
                            fileName.endsWith('3gp')
                        ) {
                            videos.push(fileName);
                        }
                    }
                });

                if (videos.length !== 0) {
                    appData.videos = videos;
                    showVideo();
                } else {
                    alert('В треде нет ни одного видео');
                    hideVideo();
                }
            })
            .catch(error => {
                console.error(error);
                alert('Возникла какая-то ошибка' + error.message);
                hideVideo();
            })
            .finally(() => {
                inputsAction('unlock');
            });
    };

    const work = url => {
        const data = threadURLData(url);

        appData.threadData = data;

        APIRequest();
    };

    form.addEventListener('submit', e => {
        e.preventDefault();

        const formData = new FormData(e.target);

        work(formData.get('thread_url'));
    });

    void (() => {
        try {
            let threadURL = new URL($check.get('thread_url')).href;

            form[0].value = threadURL;
            work(threadURL);
        } catch (error) {}
    })();

    const pageUrl = `${location.origin}${location.pathname}`;

    bookmark.href = `javascript:let threadUrl=location.origin+location.pathname;window.open("${pageUrl}?thread_url="+threadUrl);`;

    controlsClose.onclick = () => {
        appData = { ...appDataInit };
        hideVideo();
    };
    controlsReload.onclick = () => APIRequest();
    controlsNext.onclick = () => setRandomVideo();
});
