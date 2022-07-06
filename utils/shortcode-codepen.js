module.exports = function (url) {
    const url_array = url.split('/');

    const profile_url_array = url_array.filter((_, index) => {
        return index < url_array.length - 2 ? true : false;
    });

    const username = profile_url_array[profile_url_array.length - 1];
    const user_profile = profile_url_array.join('/');
    const data_slug_hash = url_array[url_array.length - 1];

    return `<div class="media-embed-wrapper"><p class="codepen" data-height="500" data-default-tab="result" data-slug-hash="${data_slug_hash}" data-user="${username}">
    <span><a href="${url}">See the pen</a> (<a href="${user_profile}">@${username}</a>) on <a href="https://codepen.io">CodePen</a>.</span>
    </p></div>
    <script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>`;
};
