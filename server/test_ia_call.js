import fetch from 'node-fetch';

async function testIA() {
    const payload = {
        name: "peiture vert",
        category: "peinture",
        price: 500,
        supplierId: "65f1a...someid",
        stock: 10,
        description: "peiture vert",
        specifications: "",
        city: "Tunis"
    };

    try {
        const res = await fetch('http://localhost:8002/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log("IA Analysis Result:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error calling IA:", e);
    }
}

testIA();
