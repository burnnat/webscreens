function advance() {
    fetch('/api/next')
        .then((resp) => resp.json())
        .then((result) => {
            document.getElementById('current').style = `background-image: url(/api/image/${result.value})`;
        });
}

setInterval(advance, 2000);
advance();