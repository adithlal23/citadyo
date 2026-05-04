import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: 'index.html',
                about: 'about.html',
                arrival: 'arrival-assistance.html',
                ask: 'ask-a-senior.html',
                associate: 'associate.html',
                delivery: 'delivery.html',
                driver: 'driver.html',
                investors: 'investors.html',
                rental: 'rental.html',
                settling: 'settling-kits.html',
                work: 'work-with-us.html'
            }
        }
    }
})