document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('searchForm');
    const fetchBtn = document.getElementById('fetchBtn');

    function handleSubmit(event) {
        event.preventDefault();
        const username = document.getElementById('username').value.trim();
        const mediumUsernameRegex = /^@?[a-zA-Z0-9_-]+$/;

        if (!mediumUsernameRegex.test(username)) {
            const output = document.getElementById('output');
            output.innerHTML = 'Only Medium username is acceptable.';
            output.className = 'error';
            return;
        }

        fetch(`/getFollowers?username=${username}`)
            .then(response => response.json())
            .then(data => {
                const output = document.getElementById('output');
                if (data.numFollowers === undefined || data.joinedDate === undefined) {
                    output.innerHTML = 'Only correct Medium username is acceptable.';
                    output.className = 'error';
                } else {
                    const joinedDateParts = data.joinedDate.split('-');
                    const year = joinedDateParts[0];
                    const month = joinedDateParts[1];
                    const day = joinedDateParts[2];

                    output.innerHTML = `
                        <p class="result">Followers: ${data.numFollowers}</p>
                        <p class="result">Joined Date: ${day}-${month}-${year}</p>
                    `;
                    output.className = '';
                }
            })
            .catch(error => {
                const output = document.getElementById('output');
                output.innerHTML = 'Error: ' + error.message;
                output.className = 'error';
            });
    }

    form.addEventListener('submit', handleSubmit);
    fetchBtn.addEventListener('click', handleSubmit);
});
