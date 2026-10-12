"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/** Panels stay mounted so every tab's content is in the server HTML (search engines, no-JS). */
export function ItemTabs({ tabs }: { tabs: { value: string; label: string; content: React.ReactNode }[] }) {
  return (
    <Tabs defaultValue={tabs[0].value}>
      <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden">
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.value} value={t.value} keepMounted className="pt-6 data-[hidden]:hidden">
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
