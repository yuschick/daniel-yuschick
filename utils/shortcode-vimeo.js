module.exports = function (url, title) {
    if (!title) throw error('A title is required when loading Vimeo content.');
    if (!url) return '';

    const id = url.replace('https://vimeo.com/', '');
    return `<div class="media-embed-wrapper">
    <div style="padding:56.25% 0 0 0;position:relative;">
    <iframe src="https://player.vimeo.com/video/${id}?h=88c93cde2a&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;" title="${title}"></iframe>
    </div>
    </div>
    <script src="https://player.vimeo.com/api/player.js"></script>`;
};
