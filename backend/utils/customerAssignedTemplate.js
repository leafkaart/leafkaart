const customerAssignedTemplate = (customerName, orderNumber, dealerName) => `
  <h2>Hello ${customerName},</h2>
  <p>Your order <b>${orderNumber}</b> has been assigned to dealer: <b>${dealerName}</b>.</p>
  <p>The dealer will contact you shortly for further processing.</p>
  <br/>
  <p>Thanks,<br/>LeafKart Team</p>
`;

module.exports = customerAssignedTemplate;