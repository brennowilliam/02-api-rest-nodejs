import { expect, it, beforeAll, afterAll, describe, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
// import { beforeEach } from 'node:test'
import { execSync } from 'node:child_process'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })
  
  afterAll(async () => {
    await app.close()
  })
  
  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  // e2e -> Que nem amigs, poucos e bons!

  it('should be able to create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        amount: 5000,
        type: 'credit',
      })
    .expect(201)
  })
  
  it('should be able to list all transactions', async () => {
    const createFirstTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        amount: 5000,
        type: 'credit',
      })

    // We only need to set and get the cookie one time for all other
    // requests. If we don't set the cookie, it will generate one
    // everytime and it wouldn't work.
    const cookies = createFirstTransactionResponse.get('Set-Cookie')
      
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        amount: 7250,
        type: 'credit',
      })
      .set('Cookie', cookies)

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New Transaction',
        amount: 5000,
      }),
      expect.objectContaining({
        title: 'New Transaction',
        amount: 7250,
      })
    ])
  });

  it('should be able to get a specific transaction', async () => {
    const createFirstTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createFirstTransactionResponse.get('Set-Cookie')
      
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        amount: 7250,
        type: 'credit',
      })
      .set('Cookie', cookies)

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    const transactionId = listTransactionsResponse.body.transactions[0].id

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'New Transaction',
        amount: 5000,
      }),
    )
  });

  
it('should be able to get the summary', async () => {
  const createFirstTransactionResponse = await request(app.server)
    .post('/transactions')
    .send({
      title: 'New Transaction',
      amount: 5000,
      type: 'credit',
    })

  const cookies = createFirstTransactionResponse.get('Set-Cookie')
    
  await request(app.server)
    .post('/transactions')
    .send({
      title: 'Debit Transaction',
      amount: 2000,
      type: 'debit',
    })
    .set('Cookie', cookies)

    const summaryResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(summaryResponse.body.summary).toEqual({
      amount: 3000,
    })
  });

})
