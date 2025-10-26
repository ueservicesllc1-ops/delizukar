require('dotenv').config();
const express = require('express');
const cors = require('cors');
const EasyPost = require('@easypost/api');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar EasyPost
const easypost = new EasyPost(process.env.EASYPOST_API_KEY);

// Configurar Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Base de datos simulada de pedidos
let orders = [
  {
    id: 'ORD001',
    nombre: 'Juan Pérez',
    email: 'juan.perez@example.com',
    direccion: {
      street1: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'US'
    },
    estado: 'pending',
    tracking_code: null,
    label_url: null
  },
  {
    id: 'ORD002',
    nombre: 'María García',
    email: 'maria.garcia@example.com',
    direccion: {
      street1: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001',
      country: 'US'
    },
    estado: 'pending',
    tracking_code: null,
    label_url: null
  },
  {
    id: 'ORD003',
    nombre: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@example.com',
    direccion: {
      street1: '789 Pine St',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      country: 'US'
    },
    estado: 'pending',
    tracking_code: null,
    label_url: null
  }
];

// Función para enviar email al cliente
async function sendShippingEmail(order, labelUrl, trackingCode, customEmail = null) {
  try {
    const recipientEmail = customEmail || order.email;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `Tu pedido ${order.id} ha sido enviado`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C8626D;">¡Tu pedido ha sido enviado!</h2>
          
          <p>Hola <strong>${order.nombre}</strong>,</p>
          
          <p>¡Buenas noticias! Tu pedido <strong>${order.id}</strong> ha sido enviado y está en camino.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #C8626D; margin-top: 0;">Información de Seguimiento</h3>
            <p><strong>Código de seguimiento:</strong> <code style="background: white; padding: 5px 10px; border-radius: 4px;">${trackingCode}</code></p>
            <p><strong>Seguir en vivo:</strong> <a href="https://track.easypost.com/d/${trackingCode}" style="color: #C8626D; text-decoration: none;">Ver ubicación del paquete</a></p>
          </div>
          
          <div style="margin: 20px 0;">
            <a href="${labelUrl}" 
               style="background-color: #C8626D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              📄 Descargar Etiqueta PDF
            </a>
          </div>
          
          <div style="background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #666;">
              <strong>Dirección de entrega:</strong><br>
              ${order.direccion.street1}<br>
              ${order.direccion.city}, ${order.direccion.state} ${order.direccion.zip}<br>
              ${order.direccion.country}
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Este es un correo automático, por favor no respondas a este mensaje.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email enviado a ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return false;
  }
}

// Endpoint: Obtener todos los pedidos
app.get('/api/orders', (req, res) => {
  try {
    console.log('📦 Obteniendo lista de pedidos...');
    res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error('❌ Error obteniendo pedidos:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint: Enviar email de prueba
app.post('/api/send-test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email es requerido'
      });
    }

    console.log(`📧 Enviando email de prueba a ${email}...`);

    // Crear datos de prueba
    const testOrder = {
      nombre: 'Cliente de Prueba',
      id: 'TEST-' + Date.now(),
      direccion: {
        street1: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        country: 'US'
      }
    };

    const testTrackingCode = 'EZ' + Date.now().toString().substring(4, 14);
    const testLabelUrl = 'https://www.easypost.com/example-label.pdf';

    // Enviar email de prueba
    const emailSent = await sendShippingEmail(testOrder, testLabelUrl, testTrackingCode, email);

    if (emailSent) {
      res.json({
        success: true,
        message: 'Email de prueba enviado exitosamente',
        data: {
          to: email,
          trackingCode: testTrackingCode
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al enviar email de prueba'
      });
    }

  } catch (error) {
    console.error('❌ Error enviando email de prueba:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint: Crear envío para un pedido
app.post('/api/create-shipment', async (req, res) => {
  try {
    const { orderId } = req.body;
    console.log(`🚚 Creando envío para pedido: ${orderId}`);

    // Buscar el pedido
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }

    // Verificar si ya tiene envío creado
    if (order.tracking_code) {
      return res.status(400).json({
        success: false,
        error: 'Este pedido ya tiene un envío creado'
      });
    }

    // Crear direcciones en EasyPost
    console.log('📍 Creando direcciones en EasyPost...');
    
    // Dirección del remitente (tu empresa)
    const fromAddress = await easypost.Address.create({
      name: 'Delizukar',
      street1: '123 Delizukar St',
      city: 'Miami',
      state: 'FL',
      zip: '33101',
      country: 'US',
      email: 'envios@delizukar.com'
    });

    // Dirección del destinatario
    const toAddress = await easypost.Address.create({
      name: order.nombre,
      street1: order.direccion.street1,
      city: order.direccion.city,
      state: order.direccion.state,
      zip: order.direccion.zip,
      country: order.direccion.country
    });

    // Crear parcel (paquete)
    console.log('📦 Creando información del paquete...');
    const parcel = await easypost.Parcel.create({
      length: 10,
      width: 10,
      height: 5,
      weight: 1.5
    });

    // Crear el shipment
    console.log('🚀 Creando shipment en EasyPost...');
    const shipment = await easypost.Shipment.create({
      to_address: toAddress,
      from_address: fromAddress,
      parcel: parcel
    });

    // Comprar la etiqueta
    console.log('💰 Comprando etiqueta...');
    await shipment.buy(shipment.lowestRate());

    // Extraer información de la etiqueta
    const trackingCode = shipment.tracking_code;
    const labelUrl = shipment.postage_label.label_url;

    console.log(`✅ Etiqueta creada: ${trackingCode}`);

    // Actualizar el pedido en la base de datos
    const orderIndex = orders.findIndex(o => o.id === orderId);
    orders[orderIndex].tracking_code = trackingCode;
    orders[orderIndex].label_url = labelUrl;
    orders[orderIndex].estado = 'shipped';

    // Enviar email al cliente
    console.log(`📧 Enviando email a ${order.email}...`);
    const emailSent = await sendShippingEmail(order, labelUrl, trackingCode);

    // Responder al frontend
    res.json({
      success: true,
      message: 'Envío creado exitosamente',
      data: {
        orderId: order.id,
        trackingCode: trackingCode,
        labelUrl: labelUrl,
        emailSent: emailSent
      }
    });

  } catch (error) {
    console.error('❌ Error creando envío:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 Servidor iniciado en puerto', PORT);
  console.log('📧 Email configurado:', process.env.EMAIL_USER ? '✅' : '❌');
  console.log('📦 EasyPost configurado:', process.env.EASYPOST_API_KEY ? '✅' : '❌');
});
