import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'

import { db } from '../db'
import { goalCompletions, goals } from '../db/schema'
import { and, count, eq, gte, lte, sql } from 'drizzle-orm'

dayjs.extend(weekOfYear)

export default async function getWeekPendingGoals() {
  const firstDayOfweek = dayjs().startOf('week').toDate()
  const lastDayOfweek = dayjs().endOf('week').toDate()

  const goalsCreatedUpToWeek = db.$with('goals_created_up_to_week').as(
    db
      .select({
        id: goals.id,
        title: goals.title,
        desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
        createdAt: goals.createdAt
      })
      .from(goals)
      .where(lte(goals.createdAt, lastDayOfweek))
  )

  const goalCompletionCounts = db.$with('goal_completion_counts').as(
    db
      .select({
        goalId: goalCompletions.goalId,
        completionCount: count(goalCompletions.id).as('completionCount')
      })
      .from(goalCompletions)
      .where(
        and(
          gte(goalCompletions.createdAt, firstDayOfweek),
          lte(goalCompletions.createdAt, lastDayOfweek)
        )
      )
      .groupBy(goalCompletions.goalId)
  )

  const peddingGoals = await db
    .with(goalsCreatedUpToWeek, goalCompletionCounts)
    .select({
      id: goalsCreatedUpToWeek.id,
      title: goalsCreatedUpToWeek.title,
      desiredWeeklyFrequency: goalsCreatedUpToWeek.desiredWeeklyFrequency,
      completionCount: sql/*sql*/ `
        COALESCE(${goalCompletionCounts.completionCount}, 0)
      `.mapWith(Number)
    })
    .from(goalsCreatedUpToWeek)
    .leftJoin(
      goalCompletionCounts,
      eq(goalsCreatedUpToWeek.id, goalCompletionCounts.goalId)
    )

  return {
    peddingGoals
  }
}
