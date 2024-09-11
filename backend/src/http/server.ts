import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider
} from 'fastify-type-provider-zod'
import { createGoal } from '../functions/create-goal'
import z from 'zod'
import getWeekPendingGoals from '../functions/get-week-pending-goals'
import { CreateGoalCompletion } from '../functions/create-goal-completion'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.get('/pending-goals', async (req, res) => {
  const { peddingGoals } = await getWeekPendingGoals()
  return { peddingGoals }
})

app.post(
  '/goals',
  {
    schema: {
      body: z.object({
        title: z.string(),
        desiredWeeklyFrequency: z.number().int().min(1).max(7)
      })
    }
  },
  async (req, res) => {
    const { title, desiredWeeklyFrequency } = req.body
    await createGoal({
      title,
      desiredWeeklyFrequency
    })
  }
)

app.post(
  '/completions',
  {
    schema: {
      body: z.object({
        goalId: z.string()
      })
    }
  },
  async (req, res) => {
    const { goalId } = req.body

    await CreateGoalCompletion({
      goalId
    })
  }
)

app
  .listen({
    port: 3333
  })
  .then(() => {
    console.log('HTTP Server is running on port 3333')
  })
