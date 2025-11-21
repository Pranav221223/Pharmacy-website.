const bcrypt = require('bcryptjs');

const myPassword = 'pcj'; // <-- CHANGE THIS to your desired password
const saltRounds = 10;

bcrypt.hash(myPassword, saltRounds, function(err, hash) {
    if (err) {
        console.error('Error generating hash:', err);
        return;
    }
    console.log('Password hash for "' + myPassword + '":');
    console.log(hash);
});