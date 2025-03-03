import discord, os
from discord.ext import commands

token = os.getenv("DISCORD_TOKEN")
intents = discord.Intents.all() #TODO: Use only the needed intents

bot = commands.Bot(command_prefix="/", intents=intents)

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}")

@bot.tree.command(name='ping', description='replies with pong!')
async def ping(interaction: discord.Interaction):
    await interaction.response.send_message(f"pong! requested by {interaction.user.mention}")


if __name__ == "__main__":
    bot.run(token)