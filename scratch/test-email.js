const { Resend } = require('resend');

const key = Buffer.from('cmVfVDdMN3pqbmVfTWZZb1BCZGI3VThCRm5zNlc0U0xDMlZq', 'base64').toString('utf8');
console.log('Testing Resend with key:', key.substring(0, 10) + '...');

const resend = new Resend(key);

async function test() {
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'delivered@resend.dev',
      subject: 'Test OTP Code',
      html: '<p>Your test OTP is 123456</p>',
    });
    console.log('Resend response:', data);
  } catch (e) {
    console.error('Resend error:', e);
  }
}

test();
