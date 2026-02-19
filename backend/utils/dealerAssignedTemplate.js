const dealerAssignedTemplate = (dealerName, orderNumber, customerName) => `
  <h2>Hello ${dealerName},</h2>
  <p>You have been assigned a new order: <b>${orderNumber}</b>.</p>
  <p>Customer: ${customerName}</p>
  <p>Please process the order as soon as possible.</p>
  <br/>
  <p>Thanks,<br/>LeafKart Team</p>
`;

module.exports = dealerAssignedTemplate;