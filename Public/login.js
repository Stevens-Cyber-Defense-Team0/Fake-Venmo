function signUp()
{
    fetch('/add-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: document.getElementById("email").value
        })
    }).then(response => {
        if (response.status == 200)
        {
            window.location.href = '/app.html';
        }
        else
        {
            response.json().then(err => {
                alert(err.error);
            });
        }
    });  
}