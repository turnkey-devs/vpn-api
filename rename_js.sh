#!/usr/bin/bash
set -e

# LOAD .ENV
if [ -f .env ]; then
	set -o allexport
	source <(cat ./.env | tr -d '[:blank:]')
	echo "NODE_ENV=$NODE_ENV"
	set +o allexport
fi

PM2=${pm2:-"node_modules/.bin/pm2"}
if [[ ! -f "${PM2}" ]]; then
	npm i -D pm2
fi

THIS_FILENAME="$(basename "$(test -L "$0" && readlink "$0" || echo "$0")")"

LOG_DIR="${STORAGE_PATH:-storage}/logs/cron"

if [[ ! -d "$LOG_DIR" ]]; then
	mkdir -p $LOG_DIR || true
fi

DATE=$(date +%Y-%m-%d)

function stopAndDelete() {
	set -f
	svc_name=${1}

	echo "[WARN] stop and deleting $svc_name"
	# stop if exist
	$PM2 stop "$svc_name" && $PM2 delete "$svc_name" || true
}

function createScriptCRON() {
	set -f
	svc_name=${1}
	cron_format=${2}

	# stop if exist
	stopAndDelete "$svc_name"

	# start
	$PM2 start ./$THIS_FILENAME --interpreter=bash --name=$svc_name --no-autorestart --cron-restart="$cron_format" --update-env $svc_name -- --start $svc_name --cron $cron_format || true
}

function createServerCRON() {
	set -f
	svc_name=${1}
	cron_format=${2}
	script_path=${3}

	# stop if exist
	stopAndDelete "$svc_name"

	# start
	$PM2 start "$script_path" --instances=2 --name=$svc_name --no-autorestart --max-memory-restart=512M --cron-restart="$cron_format" --update-env $svc_name || true
}

declare -a COMMAND_ARR=(
	"APPNAME_START_ALL"
	"APPNAME_SERVER_PROD"
	"APPNAME_SERVER_DEV"
	"APPNAME_DELETE_ALL"
)

if [[ "${1}" == "--cron" && "${2}" == "${COMMAND_ARR[0]}" ]]; then
	{
		echo '[WARN] Make sure you build before run this code'
		sh ./$THIS_FILENAME --cron "${COMMAND_ARR[1]}"
		sh ./$THIS_FILENAME --cron "${COMMAND_ARR[2]}"
		$PM2 save
	}

elif [[ "${1}" == "--cron" && "${2}" == "${COMMAND_ARR[1]}" ]]; then
	{
		echo '[WARN] Make sure you build before run this code'
		createServerCRON "${COMMAND_ARR[1]}" "0 22 * * *" "dist/src/index.js"
	}

elif [[ "${1}" == "--cron" && "${2}" == "${COMMAND_ARR[2]}" ]]; then
	{
		echo '[WARN] Make sure you build before run this code'
		createServerCRON "${COMMAND_ARR[2]}" "0 22 * * *" "dist/src/index.js"
	}

elif
	[[ "${1}" == "--cron" && "${2}" == "${COMMAND_ARR[-1]}" ]]
then
	{
		echo "[WARN] Stop and delete all services!"
		stopAndDelete "${COMMAND_ARR[1]}"
		stopAndDelete "${COMMAND_ARR[2]}"
	}

else
	echo "no argument passed!"
	echo "available command:"
	for cli in "${COMMAND_ARR[@]}"; do
		echo "--cron $cli"
	done
fi
