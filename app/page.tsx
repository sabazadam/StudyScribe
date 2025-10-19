import Link from 'next/link'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'

export default function Dashboard() {
  const recentItems = [
    {
      id: 1,
      title: 'Psychology 101 - Lecture 5',
      type: 'Study Guide',
      date: '2 days ago',
      icon: 'description',
      iconColor: 'text-accent',
    },
    {
      id: 2,
      title: 'Organic Chemistry - Reaction Mechanisms',
      type: 'Whiteboard Snap',
      date: '5 days ago',
      icon: 'image',
      iconColor: 'text-primary',
    },
    {
      id: 3,
      title: 'History of Art - Midterm Review',
      type: 'Study Guide',
      date: '1 week ago',
      icon: 'description',
      iconColor: 'text-accent',
    },
  ]

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto">
          {/* Welcome Section */}
          <h1 className="text-3xl font-bold mb-8">Welcome back, Student!</h1>

          {/* Main Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Process Lecture Card */}
            <Link href="/process-lecture">
              <Card hover className="p-8 cursor-pointer">
                <div className="flex items-center gap-6">
                  <div className="bg-accent/10 p-4 rounded-full">
                    <span className="material-symbols-outlined text-4xl text-accent">
                      mic
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-1">
                      Process a New Lecture
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Upload audio or video to generate a study guide.
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Whiteboard Enhancer Card */}
            <Link href="/enhance-whiteboard">
              <Card hover className="p-8 cursor-pointer">
                <div className="flex items-center gap-6">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <span className="material-symbols-outlined text-4xl text-primary">
                      image
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-1">
                      Enhance a Whiteboard Snap
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Clean up and digitize your whiteboard photos.
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>

          {/* Recent Items Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Recent from your Study Hub</h2>
              <Link
                href="/hub"
                className="text-primary hover:text-primary-dark font-medium text-sm transition-colors"
              >
                View All →
              </Link>
            </div>

            <div className="space-y-4">
              {recentItems.map((item) => (
                <Card key={item.id} hover className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className={`material-symbols-outlined ${item.iconColor}`}>
                        {item.icon}
                      </span>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.type} • Created: {item.date}
                        </p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
